-- Goalpost: a weekly learning ritual shared by a small private space.
-- Sunday: each member picks a topic. Friday: members interview each other.
-- Everything is private to the members of a space. Nothing is readable by anon.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  email_nudges boolean not null default true,
  last_nudged_on date,
  created_at timestamptz not null default now()
);
create index profiles_space_idx on public.profiles(space_id);

-- One row per member per week, created when the member picks a topic.
create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  week_start date not null check (extract(dow from week_start) = 0),
  topic text not null check (char_length(btrim(topic)) between 1 and 120),
  notes text not null default '' check (char_length(notes) <= 20000),
  takeaway text not null default '' check (char_length(takeaway) <= 2000),
  -- Friday 00:00 of this week in the space timezone at creation. Frozen, so
  -- changing the timezone later cannot reveal interview questions early.
  reveals_at timestamptz not null default 'infinity',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index weeks_start_idx on public.weeks(week_start desc);

-- Interview questions written by other members for someone's week.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index questions_week_idx on public.questions(week_id, created_at);

-- Shared "up next" list of topics someone might pick.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  added_by uuid default auth.uid() references public.profiles(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now()
);
create index topics_space_idx on public.topics(space_id, created_at);

-- Longer-running goals: at most two active per member.
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index goals_user_idx on public.goals(user_id, created_at);

-- One line per goal per week.
create table public.checkins (
  goal_id uuid not null references public.goals(id) on delete cascade,
  week_start date not null check (extract(dow from week_start) = 0),
  body text not null check (char_length(btrim(body)) between 1 and 280),
  updated_at timestamptz not null default now(),
  primary key (goal_id, week_start)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.my_space_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select space_id from public.profiles where id = (select auth.uid())
$$;

create function public.shares_space(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.space_id = public.my_space_id()
  )
$$;

-- Only zones the app's Intl also knows: Postgres additionally lists posix/*,
-- right/* and a few aliases such as Factory, which Intl rejects.
create function public.valid_timezone(p_timezone text)
returns text
language sql stable set search_path = ''
as $$
  select coalesce(
    (
      select name from pg_catalog.pg_timezone_names
      where name = p_timezone
        and name !~ '^(posix|right)/'
        and name not in ('Factory', 'localtime', 'posixrules')
    ),
    'UTC'
  )
$$;

-- Authors always read their own questions. The person being interviewed
-- reads them from the week's frozen reveal instant (Friday). Other members
-- read them only while both the week's owner and the author share their
-- space, so questions never follow a member who moves to another space.
create function public.can_read_question(p_week_id uuid, p_author_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_author_id = (select auth.uid())
    or exists (
      select 1
      from public.weeks w
      where w.id = p_week_id
        and (
          (w.user_id = (select auth.uid()) and now() >= w.reveals_at)
          or (
            w.user_id <> (select auth.uid())
            and public.shares_space(w.user_id)
            and public.shares_space(p_author_id)
          )
        )
    )
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create function public.set_week_reveal()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_timezone text;
begin
  select s.timezone into v_timezone
  from public.profiles p
  join public.spaces s on s.id = p.space_id
  where p.id = new.user_id;
  new.reveals_at := (new.week_start + 5)::timestamp
    at time zone coalesce(v_timezone, 'UTC');
  return new;
end
$$;

create trigger weeks_reveal before insert or update of week_start on public.weeks
  for each row execute function public.set_week_reveal();

create trigger weeks_touch before update on public.weeks
  for each row execute function public.touch_updated_at();
create trigger checkins_touch before update on public.checkins
  for each row execute function public.touch_updated_at();

create function public.enforce_goal_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- BEFORE triggers run ahead of RLS. Leave writes for someone else's goals
  -- to RLS so this message never reveals another member's goal count.
  if (select auth.uid()) is not null and new.user_id <> (select auth.uid()) then
    return new;
  end if;
  -- Serialise per member so concurrent inserts cannot both pass the count.
  perform pg_advisory_xact_lock(
    hashtextextended('goal-limit:' || new.user_id::text, 0)
  );
  if new.finished_at is null and (
    select count(*) from public.goals g
    where g.user_id = new.user_id and g.finished_at is null and g.id <> new.id
  ) >= 2 then
    raise exception 'You can keep two goals going at once. Finish or drop one first.'
      using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger goals_limit before insert or update of finished_at on public.goals
  for each row execute function public.enforce_goal_limit();

-- A space with no members left is removed, along with its topic list.
create function public.drop_empty_space()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Lock the space so concurrent leaves serialise; the delete below then sees
  -- every committed departure. NO KEY UPDATE does not block profile FK checks.
  perform 1 from public.spaces where id = old.space_id for no key update;
  delete from public.spaces s
  where s.id = old.space_id
    and not exists (select 1 from public.profiles p where p.space_id = s.id);
  return null;
end
$$;

create trigger profiles_leave_space after delete or update of space_id on public.profiles
  for each row execute function public.drop_empty_space();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- First-time setup: create a profile in a new space, or in the invited one.
create function public.enter_space(
  p_display_name text,
  p_timezone text default 'UTC',
  p_invite_code text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_code text := btrim(coalesce(p_invite_code, ''));
  v_space uuid;
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  if char_length(v_name) not between 1 and 40 then
    raise exception 'Use a name between 1 and 40 characters.' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where id = v_user) then
    raise exception 'You are already set up.' using errcode = '23505';
  end if;

  if v_code <> '' then
    -- The lock keeps the last member from leaving (and the space from being
    -- dropped) while we join. A space with no members is never joined.
    select s.id into v_space from public.spaces s
    where s.invite_code = v_code
    for no key update;
    if v_space is not null and not exists (
      select 1 from public.profiles p where p.space_id = v_space
    ) then
      v_space := null;
    end if;
    if v_space is null then
      raise exception 'That invite link is no longer valid.' using errcode = 'P0002';
    end if;
  else
    insert into public.spaces (timezone)
    values (public.valid_timezone(p_timezone))
    returning id into v_space;
  end if;

  insert into public.profiles (id, space_id, display_name)
  values (v_user, v_space, v_name);
  return v_space;
end
$$;

-- An existing member moves to the invited space. Their weeks and goals follow.
create function public.join_space(p_invite_code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_space uuid;
  v_old_space uuid;
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  -- Locking our own profile serialises concurrent calls by the same member.
  select space_id into v_old_space from public.profiles
  where id = v_user
  for update;
  if v_old_space is null then
    raise exception 'Finish setting up first.' using errcode = 'P0002';
  end if;
  select s.id into v_space from public.spaces s
  where s.invite_code = btrim(coalesce(p_invite_code, ''));
  if v_space is null then
    raise exception 'That invite link is no longer valid.' using errcode = 'P0002';
  end if;

  -- Lock both spaces in a fixed order so two members swapping spaces at the
  -- same time cannot deadlock, then re-check: the target may have emptied.
  perform 1 from public.spaces
  where id in (v_space, v_old_space)
  order by id
  for no key update;
  if not exists (
    select 1 from public.profiles p where p.space_id = v_space
  ) then
    raise exception 'That invite link is no longer valid.' using errcode = 'P0002';
  end if;

  update public.profiles set space_id = v_space where id = v_user;

  -- A reveal instant may only move later, so moving to a space further east
  -- and back cannot surface interview questions early.
  update public.weeks w
  set reveals_at = greatest(
    w.reveals_at,
    (w.week_start + 5)::timestamp at time zone s.timezone
  )
  from public.spaces s
  where s.id = v_space
    and w.user_id = v_user
    and w.reveals_at > now();
  return v_space;
end
$$;

-- Names of the people in an invited space, shown to a signed-in invitee.
create function public.invite_preview(p_invite_code text)
returns table (display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.display_name
  from public.profiles p
  join public.spaces s on s.id = p.space_id
  where s.invite_code = btrim(coalesce(p_invite_code, ''))
    and (select auth.uid()) is not null
  order by p.created_at
$$;

create function public.rotate_invite()
returns text
language sql security definer set search_path = ''
as $$
  update public.spaces
  set invite_code = encode(extensions.gen_random_bytes(12), 'hex')
  where id = public.my_space_id()
  returning invite_code
$$;

create function public.set_space_timezone(p_timezone text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_timezone text;
begin
  v_timezone := public.valid_timezone(p_timezone);
  if v_timezone is distinct from p_timezone then
    raise exception 'Pick a timezone from the list.' using errcode = '22023';
  end if;
  update public.spaces
  set timezone = v_timezone
  where id = public.my_space_id()
  returning timezone into v_timezone;

  -- A reveal instant may only move later: switching east and back before
  -- picking a topic must not freeze an early Friday.
  update public.weeks w
  set reveals_at = greatest(
    w.reveals_at,
    (w.week_start + 5)::timestamp at time zone v_timezone
  )
  from public.profiles p
  where p.id = w.user_id
    and p.space_id = public.my_space_id()
    and w.reveals_at > now();
  return v_timezone;
end
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.spaces enable row level security;
alter table public.profiles enable row level security;
alter table public.weeks enable row level security;
alter table public.questions enable row level security;
alter table public.topics enable row level security;
alter table public.goals enable row level security;
alter table public.checkins enable row level security;

create policy "members read their space" on public.spaces
  for select to authenticated using (id = public.my_space_id());

create policy "members read profiles in their space" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or space_id = public.my_space_id());
create policy "members update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read weeks in their space" on public.weeks
  for select to authenticated using (public.shares_space(user_id));
create policy "members create their own weeks" on public.weeks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "members update their own weeks" on public.weeks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members delete their own weeks" on public.weeks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "questions stay hidden until interview day" on public.questions
  for select to authenticated using (public.can_read_question(week_id, author_id));
create policy "members question other members" on public.questions
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.weeks w
      where w.id = week_id
        and w.user_id <> (select auth.uid())
        and public.shares_space(w.user_id)
    )
  );
create policy "authors delete their questions" on public.questions
  for delete to authenticated using (author_id = (select auth.uid()));

create policy "members read their topic list" on public.topics
  for select to authenticated using (space_id = public.my_space_id());
create policy "members add topics" on public.topics
  for insert to authenticated
  with check (space_id = public.my_space_id() and added_by = (select auth.uid()));
create policy "members remove topics" on public.topics
  for delete to authenticated using (space_id = public.my_space_id());

create policy "members read goals in their space" on public.goals
  for select to authenticated using (public.shares_space(user_id));
create policy "members create their own goals" on public.goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "members update their own goals" on public.goals
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members delete their own goals" on public.goals
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "members read check-ins in their space" on public.checkins
  for select to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and public.shares_space(g.user_id)
  ));
create policy "members write their own check-ins" on public.checkins
  for insert to authenticated
  with check (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = (select auth.uid())
  ));
create policy "members edit their own check-ins" on public.checkins
  for update to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = (select auth.uid())
  ));
create policy "members delete their own check-ins" on public.checkins
  for delete to authenticated
  using (exists (
    select 1 from public.goals g
    where g.id = goal_id and g.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Privileges: explicit, so nothing depends on platform defaults.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on public.spaces to authenticated;
grant select on public.profiles to authenticated;
-- space_id and last_nudged_on are deliberately not updatable by members.
grant update (display_name, email_nudges) on public.profiles to authenticated;
grant select, insert, delete on public.weeks to authenticated;
grant update (topic, notes, takeaway) on public.weeks to authenticated;
grant select, insert, delete on public.questions to authenticated;
grant select, insert, delete on public.topics to authenticated;
grant select, insert, delete on public.goals to authenticated;
grant update (title, finished_at) on public.goals to authenticated;
grant select, insert, delete on public.checkins to authenticated;
grant update (body) on public.checkins to authenticated;

grant all on all tables in schema public to service_role;

grant execute on function public.my_space_id() to authenticated;
grant execute on function public.shares_space(uuid) to authenticated;
grant execute on function public.can_read_question(uuid, uuid) to authenticated;
grant execute on function public.enter_space(text, text, text) to authenticated;
grant execute on function public.join_space(text) to authenticated;
grant execute on function public.invite_preview(text) to authenticated;
grant execute on function public.rotate_invite() to authenticated;
grant execute on function public.set_space_timezone(text) to authenticated;
grant execute on all functions in schema public to service_role;
