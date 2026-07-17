begin;

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

create type public.list_role as enum ('owner', 'editor', 'viewer');
create type public.idea_status as enum ('active', 'archived', 'done');
create type public.goal_status as enum ('active', 'waiting', 'done');
create type public.invitation_status as enum ('pending', 'accepted', 'declined');
create type public.friend_request_status as enum ('pending', 'accepted', 'declined');
create type public.attachment_kind as enum ('image', 'document', 'link');
create type public.goal_event_type as enum ('delivery', 'deadline', 'milestone', 'resume', 'custom');
create type public.moderation_state as enum ('visible', 'hidden', 'removed');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.reminder_status as enum ('scheduled', 'processing', 'sent', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_path text,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  email_reminders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_username check (username::text ~ '^[a-z0-9_]{3,30}$')
);

create table public.account_moderation (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_suspended boolean not null default false,
  suspended_reason text,
  suspended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_friend_request check (sender_id <> recipient_id),
  unique (sender_id, recipient_id)
);

create table public.friendships (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  constraint ordered_friendship check (user_a < user_b)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table public.idea_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_members (
  list_id uuid not null references public.idea_lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.list_role not null,
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table public.list_invitations (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.idea_lists(id) on delete cascade,
  inviter_id uuid references public.profiles(id) on delete set null,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  role public.list_role not null check (role <> 'owner'),
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (list_id, invitee_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.idea_lists(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.idea_status not null default 'active',
  tags text[] not null default '{}',
  position numeric(20, 10) not null default 1000,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  completed_at timestamptz
);

create table public.goalposts (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.goal_status not null default 'active',
  tags text[] not null default '{}',
  started_on date not null default current_date,
  completed_at timestamptz,
  parent_goalpost_id uuid references public.goalposts(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  admin_user_id uuid references public.profiles(id) on delete restrict,
  moderation_state public.moderation_state not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_parent check (parent_goalpost_id is null or parent_goalpost_id <> id)
);

create table public.goal_collaborators (
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (goalpost_id, user_id)
);

create unique index one_goal_admin on public.goal_collaborators(goalpost_id) where is_admin;

create table public.goal_invitations (
  id uuid primary key default gen_random_uuid(),
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  inviter_id uuid references public.profiles(id) on delete set null,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (goalpost_id, invitee_id)
);

create table public.goal_updates (
  id uuid primary key default gen_random_uuid(),
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content jsonb not null,
  moderation_state public.moderation_state not null default 'visible',
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text check (description is null or char_length(description) <= 2000),
  assignee_user_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  position numeric(20, 10) not null default 1000,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_events (
  id uuid primary key default gen_random_uuid(),
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text check (description is null or char_length(description) <= 2000),
  event_type public.goal_event_type not null default 'custom',
  starts_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete cascade,
  goalpost_id uuid references public.goalposts(id) on delete cascade,
  title text not null default 'Checklist' check (char_length(title) between 1 and 120),
  position numeric(20, 10) not null default 1000,
  created_at timestamptz not null default now(),
  constraint one_checklist_parent check (num_nonnulls(idea_id, goalpost_id) = 1)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  completed_at timestamptz,
  position numeric(20, 10) not null default 1000,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete cascade,
  goalpost_id uuid references public.goalposts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  moderation_state public.moderation_state not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_comment_parent check (num_nonnulls(idea_id, goalpost_id) = 1)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete cascade,
  goalpost_id uuid references public.goalposts(id) on delete cascade,
  goal_update_id uuid references public.goal_updates(id) on delete cascade,
  kind public.attachment_kind not null,
  title text not null check (char_length(title) between 1 and 240),
  url text,
  storage_path text unique,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size between 0 and 26214400),
  uploaded_by uuid references public.profiles(id) on delete set null,
  moderation_state public.moderation_state not null default 'visible',
  created_at timestamptz not null default now(),
  constraint one_attachment_parent check (num_nonnulls(idea_id, goalpost_id, goal_update_id) = 1),
  constraint attachment_source check (
    (kind = 'link' and url is not null and storage_path is null)
    or (kind in ('image', 'document') and storage_path is not null and url is null)
  )
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goalpost_id uuid not null references public.goalposts(id) on delete cascade,
  goal_task_id uuid references public.goal_tasks(id) on delete cascade,
  goal_event_id uuid references public.goal_events(id) on delete cascade,
  remind_at timestamptz not null,
  send_email boolean not null default true,
  status public.reminder_status not null default 'scheduled',
  claimed_at timestamptz,
  sent_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  constraint at_most_one_reminder_subject check (num_nonnulls(goal_task_id, goal_event_id) <= 1)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  notification_type text not null check (char_length(notification_type) between 1 and 60),
  title text not null check (char_length(title) between 1 and 180),
  body text check (body is null or char_length(body) <= 1000),
  href text,
  source_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('profile', 'goalpost', 'goal_update', 'comment', 'attachment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 100),
  details text check (details is null or char_length(details) <= 2000),
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  actor_key text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles using gin (to_tsvector('simple', display_name));
create index ideas_list_position_idx on public.ideas(list_id, status, position);
create index ideas_search_idx on public.ideas using gin (to_tsvector('english', title || ' ' || content::text));
create index ideas_tags_idx on public.ideas using gin (tags);
create index goalposts_started_idx on public.goalposts(started_on desc, created_at desc);
create index goalposts_search_idx on public.goalposts using gin (to_tsvector('english', title || ' ' || content::text));
create index goalposts_tags_idx on public.goalposts using gin (tags);
create index goal_collaborators_user_idx on public.goal_collaborators(user_id, joined_at);
create index goal_updates_goal_idx on public.goal_updates(goalpost_id, published_at desc);
create index goal_events_date_idx on public.goal_events(starts_at);
create index goal_tasks_due_idx on public.goal_tasks(due_at) where due_at is not null;
create index reminders_due_idx on public.reminders(remind_at) where status in ('scheduled', 'failed');
create index notifications_user_idx on public.notifications(user_id, read_at, created_at desc);
create index reports_queue_idx on public.reports(status, created_at);
create index rate_limit_lookup_idx on public.rate_limit_events(actor_key, action, created_at desc);

grant usage on schema public to anon, authenticated, service_role;
grant select on table
  public.profiles,
  public.goalposts,
  public.goal_collaborators,
  public.goal_updates,
  public.goal_tasks,
  public.goal_events,
  public.checklists,
  public.checklist_items,
  public.comments,
  public.attachments,
  public.activity_logs
to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger lists_updated before update on public.idea_lists for each row execute function public.set_updated_at();
create trigger ideas_updated before update on public.ideas for each row execute function public.set_updated_at();
create trigger goalposts_updated before update on public.goalposts for each row execute function public.set_updated_at();
create trigger goal_updates_updated before update on public.goal_updates for each row execute function public.set_updated_at();
create trigger goal_tasks_updated before update on public.goal_tasks for each row execute function public.set_updated_at();
create trigger goal_events_updated before update on public.goal_events for each row execute function public.set_updated_at();
create trigger comments_updated before update on public.comments for each row execute function public.set_updated_at();

create or replace function public.is_platform_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select raw_app_meta_data ->> 'role' = 'admin' from auth.users where id = p_user_id), false);
$$;

create or replace function public.is_suspended(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_suspended from public.account_moderation where user_id = p_user_id), false);
$$;

create or replace function public.current_list_role(p_list_id uuid, p_user_id uuid default auth.uid())
returns public.list_role language sql stable security definer set search_path = '' as $$
  select role from public.list_members where list_id = p_list_id and user_id = p_user_id;
$$;

create or replace function public.is_goal_collaborator(p_goalpost_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.goal_collaborators where goalpost_id = p_goalpost_id and user_id = p_user_id);
$$;

create or replace function public.is_goal_admin(p_goalpost_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.goal_collaborators where goalpost_id = p_goalpost_id and user_id = p_user_id and is_admin);
$$;

create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.friendships
    where user_a = least(p_user_a, p_user_b) and user_b = greatest(p_user_a, p_user_b)
  );
$$;

create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.blocks
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;

create or replace function public.can_view_idea(p_idea_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.ideas i
    join public.list_members lm on lm.list_id = i.list_id
    where i.id = p_idea_id and lm.user_id = p_user_id
  );
$$;

create or replace function public.can_edit_idea(p_idea_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.ideas i
    join public.list_members lm on lm.list_id = i.list_id
    where i.id = p_idea_id and lm.user_id = p_user_id and lm.role in ('owner', 'editor')
  );
$$;

create or replace function public.complete_onboarding(p_username text, p_display_name text, p_timezone text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_list_id uuid;
  v_username text := lower(trim(p_username));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_username !~ '^[a-z0-9_]{3,30}$' then raise exception 'Invalid username'; end if;
  if v_username = any(array['app','admin','api','auth','g','goal','goals','help','legal','login','settings','signup','support','u']) then
    raise exception 'Reserved username';
  end if;
  if length(trim(p_display_name)) not between 1 and 80 then raise exception 'Invalid display name'; end if;

  insert into public.profiles(id, username, display_name, timezone)
  values (v_user_id, v_username, trim(p_display_name), coalesce(nullif(trim(p_timezone), ''), 'UTC'))
  on conflict (id) do update set display_name = excluded.display_name, timezone = excluded.timezone;

  if not exists(select 1 from public.idea_lists where owner_id = v_user_id) then
    insert into public.idea_lists(owner_id, title, description)
    values (v_user_id, 'Inbox', 'A private landing place for thoughts before they become plans') returning id into v_list_id;
    insert into public.list_members(list_id, user_id, role) values (v_list_id, v_user_id, 'owner');
  end if;
  return v_user_id;
end;
$$;

create or replace function public.create_idea_list(p_title text, p_description text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_list_id uuid;
begin
  if auth.uid() is null or public.is_suspended(auth.uid()) then raise exception 'Not authorized'; end if;
  if length(trim(p_title)) not between 1 and 120 then raise exception 'Invalid list title'; end if;
  insert into public.idea_lists(owner_id, title, description)
  values (auth.uid(), trim(p_title), nullif(trim(p_description), '')) returning id into v_list_id;
  insert into public.list_members(list_id, user_id, role) values (v_list_id, auth.uid(), 'owner');
  return v_list_id;
end;
$$;

create or replace function public.create_goalpost(
  p_title text,
  p_content jsonb default '{"type":"doc","content":[]}'::jsonb,
  p_tags text[] default '{}',
  p_started_on date default current_date,
  p_parent_goalpost_id uuid default null
)
returns table(goalpost_id uuid, public_id uuid) language plpgsql security definer set search_path = '' as $$
declare v_goal_id uuid; v_public_id uuid;
begin
  if auth.uid() is null or public.is_suspended(auth.uid()) then raise exception 'Not authorized'; end if;
  if length(trim(p_title)) not between 1 and 180 then raise exception 'Invalid goal title'; end if;
  if p_parent_goalpost_id is not null and not public.is_goal_collaborator(p_parent_goalpost_id, auth.uid()) then raise exception 'Parent goal must belong to your tree'; end if;
  insert into public.goalposts(title, content, tags, started_on, parent_goalpost_id, created_by, admin_user_id)
  values (trim(p_title), coalesce(p_content, '{"type":"doc","content":[]}'::jsonb), coalesce(p_tags, '{}'), coalesce(p_started_on, current_date), p_parent_goalpost_id, auth.uid(), auth.uid())
  returning id, goalposts.public_id into v_goal_id, v_public_id;
  insert into public.goal_collaborators(goalpost_id, user_id, is_admin) values (v_goal_id, auth.uid(), true);
  return query select v_goal_id, v_public_id;
end;
$$;

create or replace function public.promote_idea(p_idea_id uuid)
returns table(goalpost_id uuid, public_id uuid) language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_idea public.ideas%rowtype;
  v_owner_id uuid;
  v_goal_id uuid;
  v_public_id uuid;
begin
  if v_user_id is null or public.is_suspended(v_user_id) then raise exception 'Not authorized'; end if;
  select * into v_idea from public.ideas where id = p_idea_id for update;
  if not found then raise exception 'Idea not found'; end if;
  if public.current_list_role(v_idea.list_id, v_user_id) not in ('owner', 'editor') then raise exception 'Editor access required'; end if;
  select owner_id into v_owner_id from public.idea_lists where id = v_idea.list_id;

  insert into public.goalposts(title, content, tags, started_on, created_by, admin_user_id)
  values (v_idea.title, v_idea.content, v_idea.tags, current_date, v_user_id, v_owner_id)
  returning id, goalposts.public_id into v_goal_id, v_public_id;

  insert into public.goal_collaborators(goalpost_id, user_id, is_admin, joined_at)
  select v_goal_id, lm.user_id, lm.user_id = v_owner_id, now()
  from public.list_members lm
  where lm.list_id = v_idea.list_id and lm.role in ('owner', 'editor');

  update public.attachments set goalpost_id = v_goal_id, idea_id = null where idea_id = p_idea_id;
  update public.checklists set goalpost_id = v_goal_id, idea_id = null where idea_id = p_idea_id;
  update public.comments set goalpost_id = v_goal_id, idea_id = null where idea_id = p_idea_id;
  insert into public.activity_logs(actor_id, entity_type, entity_id, action, metadata)
  values (v_user_id, 'goalpost', v_goal_id, 'promoted', jsonb_build_object('source_list_id', v_idea.list_id));
  delete from public.ideas where id = p_idea_id;
  return query select v_goal_id, v_public_id;
end;
$$;

create or replace function public.respond_to_friend_request(p_request_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_request public.friend_requests%rowtype;
begin
  select * into v_request from public.friend_requests where id = p_request_id for update;
  if not found or v_request.recipient_id <> auth.uid() or v_request.status <> 'pending' then raise exception 'Request not available'; end if;
  if public.is_blocked_between(v_request.sender_id, v_request.recipient_id) then raise exception 'Interaction blocked'; end if;
  update public.friend_requests set status = case when p_accept then 'accepted'::public.friend_request_status else 'declined'::public.friend_request_status end, responded_at = now() where id = p_request_id;
  if p_accept then
    insert into public.friendships(user_a, user_b) values (least(v_request.sender_id, v_request.recipient_id), greatest(v_request.sender_id, v_request.recipient_id)) on conflict do nothing;
    insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
    values (v_request.sender_id, v_request.recipient_id, 'friend_accepted', 'Friend request accepted', 'You can now comment on each other''s public goalposts.', '/app/friends', 'friend-accepted:' || v_request.id::text)
    on conflict (source_key) do nothing;
  end if;
end;
$$;

create or replace function public.accept_list_invitation(p_invitation_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_invitation public.list_invitations%rowtype;
begin
  select * into v_invitation from public.list_invitations where id = p_invitation_id for update;
  if not found or v_invitation.invitee_id <> auth.uid() or v_invitation.status <> 'pending' then raise exception 'Invitation not available'; end if;
  if public.is_blocked_between(v_invitation.inviter_id, v_invitation.invitee_id) then raise exception 'Interaction blocked'; end if;
  update public.list_invitations set status = case when p_accept then 'accepted'::public.invitation_status else 'declined'::public.invitation_status end, responded_at = now() where id = p_invitation_id;
  if p_accept then
    insert into public.list_members(list_id, user_id, role) values (v_invitation.list_id, v_invitation.invitee_id, v_invitation.role) on conflict (list_id, user_id) do update set role = excluded.role;
    if v_invitation.inviter_id is not null then
      insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
      values (v_invitation.inviter_id, v_invitation.invitee_id, 'list_invitation_accepted', 'List invitation accepted', 'A member joined your shared idea list.', '/app/ideas/' || v_invitation.list_id::text, 'list-invite-accepted:' || v_invitation.id::text)
      on conflict (source_key) do nothing;
    end if;
  end if;
end;
$$;

create or replace function public.accept_goal_invitation(p_invitation_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_invitation public.goal_invitations%rowtype;
begin
  select * into v_invitation from public.goal_invitations where id = p_invitation_id for update;
  if not found or v_invitation.invitee_id <> auth.uid() or v_invitation.status <> 'pending' then raise exception 'Invitation not available'; end if;
  if public.is_blocked_between(v_invitation.inviter_id, v_invitation.invitee_id) then raise exception 'Interaction blocked'; end if;
  update public.goal_invitations set status = case when p_accept then 'accepted'::public.invitation_status else 'declined'::public.invitation_status end, responded_at = now() where id = p_invitation_id;
  if p_accept then
    insert into public.goal_collaborators(goalpost_id, user_id) values (v_invitation.goalpost_id, v_invitation.invitee_id) on conflict do nothing;
    if v_invitation.inviter_id is not null then
      insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
      select v_invitation.inviter_id, v_invitation.invitee_id, 'goal_invitation_accepted', 'Goal invitation accepted', 'A collaborator added the joint goal to their tree.', '/g/' || g.public_id::text, 'goal-invite-accepted:' || v_invitation.id::text
      from public.goalposts g where g.id = v_invitation.goalpost_id
      on conflict (source_key) do nothing;
    end if;
  end if;
end;
$$;

create or replace function public.transition_goal(p_goalpost_id uuid, p_status public.goal_status)
returns public.goalposts language plpgsql security definer set search_path = '' as $$
declare v_goal public.goalposts%rowtype;
begin
  if not public.is_goal_collaborator(p_goalpost_id, auth.uid()) or public.is_suspended(auth.uid()) then raise exception 'Collaborator access required'; end if;
  update public.goalposts
  set status = p_status, completed_at = case when p_status = 'done' then coalesce(completed_at, now()) else null end
  where id = p_goalpost_id returning * into v_goal;
  insert into public.activity_logs(actor_id, entity_type, entity_id, action, metadata)
  values (auth.uid(), 'goalpost', p_goalpost_id, 'status_changed', jsonb_build_object('status', p_status));
  insert into public.notifications(user_id, actor_id, notification_type, title, body, href)
  select gc.user_id, auth.uid(), 'goal_status', v_goal.title || ' is now ' || p_status::text, 'A collaborator changed the goalpost status.', '/g/' || v_goal.public_id::text
  from public.goal_collaborators gc where gc.goalpost_id = p_goalpost_id and gc.user_id <> auth.uid();
  return v_goal;
end;
$$;

create or replace function public.prepare_account_deletion()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_list record;
  v_goal record;
  v_successor uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  for v_list in select id from public.idea_lists where owner_id = v_user_id for update loop
    select user_id into v_successor from public.list_members where list_id = v_list.id and user_id <> v_user_id and role = 'editor' order by joined_at limit 1;
    if v_successor is null then
      delete from public.idea_lists where id = v_list.id;
    else
      update public.idea_lists set owner_id = v_successor where id = v_list.id;
      update public.list_members set role = 'owner' where list_id = v_list.id and user_id = v_successor;
    end if;
    v_successor := null;
  end loop;
  for v_goal in select id from public.goalposts where admin_user_id = v_user_id for update loop
    select user_id into v_successor from public.goal_collaborators where goalpost_id = v_goal.id and user_id <> v_user_id order by joined_at limit 1;
    if v_successor is null then
      delete from public.goalposts where id = v_goal.id;
    else
      update public.goalposts set admin_user_id = v_successor where id = v_goal.id;
      update public.goal_collaborators set is_admin = (user_id = v_successor) where goalpost_id = v_goal.id;
    end if;
    v_successor := null;
  end loop;
end;
$$;

create or replace function public.check_rate_limit(p_actor_key text, p_action text, p_limit integer, p_window interval)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  delete from public.rate_limit_events where created_at < now() - interval '24 hours';
  select count(*) into v_count from public.rate_limit_events where actor_key = p_actor_key and action = p_action and created_at >= now() - p_window;
  if v_count >= p_limit then return false; end if;
  insert into public.rate_limit_events(actor_key, action) values (p_actor_key, p_action);
  return true;
end;
$$;

create or replace function public.claim_due_reminders(p_limit integer default 100)
returns setof public.reminders language plpgsql security definer set search_path = '' as $$
begin
  return query
  with claimed as (
    select id from public.reminders
    where status in ('scheduled', 'failed')
      and remind_at <= now()
      and (status = 'scheduled' or attempt_count < 5)
      and (claimed_at is null or claimed_at < now() - interval '10 minutes')
    order by remind_at
    for update skip locked
    limit greatest(1, least(p_limit, 500))
  )
  update public.reminders r set status = 'processing', claimed_at = now(), attempt_count = attempt_count + 1
  from claimed where r.id = claimed.id returning r.*;
end;
$$;

revoke all on function public.claim_due_reminders(integer) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(integer) to service_role;
revoke all on function public.check_rate_limit(text, text, integer, interval) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, text, integer, interval) to service_role;
grant execute on function public.complete_onboarding(text, text, text) to authenticated;
grant execute on function public.create_idea_list(text, text) to authenticated;
grant execute on function public.create_goalpost(text, jsonb, text[], date, uuid) to authenticated;
grant execute on function public.promote_idea(uuid) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.accept_list_invitation(uuid, boolean) to authenticated;
grant execute on function public.accept_goal_invitation(uuid, boolean) to authenticated;
grant execute on function public.transition_goal(uuid, public.goal_status) to authenticated;
grant execute on function public.prepare_account_deletion() to authenticated;

alter table public.profiles enable row level security;
alter table public.account_moderation enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.idea_lists enable row level security;
alter table public.list_members enable row level security;
alter table public.list_invitations enable row level security;
alter table public.ideas enable row level security;
alter table public.goalposts enable row level security;
alter table public.goal_collaborators enable row level security;
alter table public.goal_invitations enable row level security;
alter table public.goal_updates enable row level security;
alter table public.goal_tasks enable row level security;
alter table public.goal_events enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.rate_limit_events enable row level security;

create policy "profiles are public" on public.profiles for select to anon, authenticated using (not public.is_suspended(id) or public.is_platform_admin());
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid() and not public.is_suspended()) with check (id = auth.uid());
create policy "admins read moderation" on public.account_moderation for select to authenticated using (public.is_platform_admin());
create policy "admins manage moderation" on public.account_moderation for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "users see relevant friend requests" on public.friend_requests for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_platform_admin());
create policy "users send friend requests" on public.friend_requests for insert to authenticated with check (sender_id = auth.uid() and recipient_id <> auth.uid() and not public.is_blocked_between(sender_id, recipient_id) and not public.is_suspended());
create policy "users see friendships" on public.friendships for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy "users remove friendships" on public.friendships for delete to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy "users see own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "users create own blocks" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "users remove own blocks" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy "members read lists" on public.idea_lists for select to authenticated using (public.current_list_role(id) is not null);
create policy "users create lists" on public.idea_lists for insert to authenticated with check (owner_id = auth.uid() and not public.is_suspended());
create policy "owners update lists" on public.idea_lists for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete lists" on public.idea_lists for delete to authenticated using (owner_id = auth.uid());
create policy "members read memberships" on public.list_members for select to authenticated using (public.current_list_role(list_id) is not null);
create policy "owners create memberships" on public.list_members for insert to authenticated with check (public.current_list_role(list_id) = 'owner');
create policy "owners update memberships" on public.list_members for update to authenticated using (public.current_list_role(list_id) = 'owner') with check (public.current_list_role(list_id) = 'owner');
create policy "owners remove memberships or members leave" on public.list_members for delete to authenticated using (public.current_list_role(list_id) = 'owner' or user_id = auth.uid());
create policy "relevant users read list invitations" on public.list_invitations for select to authenticated using (invitee_id = auth.uid() or public.current_list_role(list_id) = 'owner');
create policy "owners invite list members" on public.list_invitations for insert to authenticated with check (public.current_list_role(list_id) = 'owner' and inviter_id = auth.uid() and not public.is_blocked_between(inviter_id, invitee_id));
create policy "owners update list invitations" on public.list_invitations for update to authenticated using (public.current_list_role(list_id) = 'owner') with check (public.current_list_role(list_id) = 'owner');

create policy "members read ideas" on public.ideas for select to authenticated using (public.current_list_role(list_id) is not null);
create policy "editors create ideas" on public.ideas for insert to authenticated with check (public.current_list_role(list_id) in ('owner', 'editor') and created_by = auth.uid() and not public.is_suspended());
create policy "editors update ideas" on public.ideas for update to authenticated using (public.current_list_role(list_id) in ('owner', 'editor')) with check (public.current_list_role(list_id) in ('owner', 'editor'));
create policy "editors delete ideas" on public.ideas for delete to authenticated using (public.current_list_role(list_id) in ('owner', 'editor'));

create policy "visible goals are public" on public.goalposts for select to anon, authenticated using (moderation_state = 'visible' or public.is_goal_collaborator(id) or public.is_platform_admin());
create policy "users create own goals" on public.goalposts for insert to authenticated with check (created_by = auth.uid() and admin_user_id = auth.uid() and not public.is_suspended());
create policy "collaborators update goals" on public.goalposts for update to authenticated using (public.is_goal_collaborator(id) and not public.is_suspended()) with check (public.is_goal_collaborator(id));
create policy "admins delete goals" on public.goalposts for delete to authenticated using (public.is_goal_admin(id) or public.is_platform_admin());
create policy "goal collaborators are public" on public.goal_collaborators for select to anon, authenticated using (exists(select 1 from public.goalposts g where g.id = goalpost_id and (g.moderation_state = 'visible' or public.is_goal_collaborator(g.id) or public.is_platform_admin())));
create policy "goal admins manage collaborators" on public.goal_collaborators for insert to authenticated with check (public.is_goal_admin(goalpost_id));
create policy "goal admins update collaborators" on public.goal_collaborators for update to authenticated using (public.is_goal_admin(goalpost_id)) with check (public.is_goal_admin(goalpost_id));
create policy "goal admins remove or collaborators leave" on public.goal_collaborators for delete to authenticated using (public.is_goal_admin(goalpost_id) or user_id = auth.uid());
create policy "relevant users read goal invitations" on public.goal_invitations for select to authenticated using (invitee_id = auth.uid() or public.is_goal_admin(goalpost_id));
create policy "goal admins create invitations" on public.goal_invitations for insert to authenticated with check (public.is_goal_admin(goalpost_id) and inviter_id = auth.uid() and not public.is_blocked_between(inviter_id, invitee_id));
create policy "goal admins update invitations" on public.goal_invitations for update to authenticated using (public.is_goal_admin(goalpost_id)) with check (public.is_goal_admin(goalpost_id));

create policy "visible goal updates are public" on public.goal_updates for select to anon, authenticated using (moderation_state = 'visible' and exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible') or public.is_goal_collaborator(goalpost_id) or public.is_platform_admin());
create policy "collaborators create updates" on public.goal_updates for insert to authenticated with check (public.is_goal_collaborator(goalpost_id) and author_id = auth.uid() and not public.is_suspended());
create policy "authors update goal updates" on public.goal_updates for update to authenticated using (author_id = auth.uid() and public.is_goal_collaborator(goalpost_id)) with check (author_id = auth.uid());
create policy "authors or admins delete updates" on public.goal_updates for delete to authenticated using (author_id = auth.uid() or public.is_goal_admin(goalpost_id));

create policy "goal tasks are public" on public.goal_tasks for select to anon, authenticated using (exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible') or public.is_goal_collaborator(goalpost_id));
create policy "collaborators create tasks" on public.goal_tasks for insert to authenticated with check (public.is_goal_collaborator(goalpost_id) and created_by = auth.uid());
create policy "collaborators update tasks" on public.goal_tasks for update to authenticated using (public.is_goal_collaborator(goalpost_id)) with check (public.is_goal_collaborator(goalpost_id));
create policy "collaborators delete tasks" on public.goal_tasks for delete to authenticated using (public.is_goal_collaborator(goalpost_id));
create policy "goal events are public" on public.goal_events for select to anon, authenticated using (exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible') or public.is_goal_collaborator(goalpost_id));
create policy "collaborators create events" on public.goal_events for insert to authenticated with check (public.is_goal_collaborator(goalpost_id) and created_by = auth.uid());
create policy "collaborators update events" on public.goal_events for update to authenticated using (public.is_goal_collaborator(goalpost_id)) with check (public.is_goal_collaborator(goalpost_id));
create policy "collaborators delete events" on public.goal_events for delete to authenticated using (public.is_goal_collaborator(goalpost_id));

create policy "authorized users read checklists" on public.checklists for select to anon, authenticated using ((idea_id is not null and public.can_view_idea(idea_id)) or (goalpost_id is not null and exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible')));
create policy "authorized users create checklists" on public.checklists for insert to authenticated with check ((idea_id is not null and public.can_edit_idea(idea_id)) or (goalpost_id is not null and public.is_goal_collaborator(goalpost_id)));
create policy "authorized users update checklists" on public.checklists for update to authenticated using ((idea_id is not null and public.can_edit_idea(idea_id)) or (goalpost_id is not null and public.is_goal_collaborator(goalpost_id)));
create policy "authorized users delete checklists" on public.checklists for delete to authenticated using ((idea_id is not null and public.can_edit_idea(idea_id)) or (goalpost_id is not null and public.is_goal_collaborator(goalpost_id)));
create policy "authorized users read checklist items" on public.checklist_items for select to anon, authenticated using (exists(select 1 from public.checklists c where c.id = checklist_id));
create policy "authorized users create checklist items" on public.checklist_items for insert to authenticated with check (exists(select 1 from public.checklists c where c.id = checklist_id and ((c.idea_id is not null and public.can_edit_idea(c.idea_id)) or (c.goalpost_id is not null and public.is_goal_collaborator(c.goalpost_id)))));
create policy "authorized users update checklist items" on public.checklist_items for update to authenticated using (exists(select 1 from public.checklists c where c.id = checklist_id and ((c.idea_id is not null and public.can_edit_idea(c.idea_id)) or (c.goalpost_id is not null and public.is_goal_collaborator(c.goalpost_id)))));
create policy "authorized users delete checklist items" on public.checklist_items for delete to authenticated using (exists(select 1 from public.checklists c where c.id = checklist_id and ((c.idea_id is not null and public.can_edit_idea(c.idea_id)) or (c.goalpost_id is not null and public.is_goal_collaborator(c.goalpost_id)))));

create policy "authorized comments are readable" on public.comments for select to anon, authenticated using ((idea_id is not null and public.can_view_idea(idea_id)) or (goalpost_id is not null and moderation_state = 'visible' and exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible')) or public.is_platform_admin());
create policy "authorized users create comments" on public.comments for insert to authenticated with check (author_id = auth.uid() and not public.is_suspended() and ((idea_id is not null and public.can_view_idea(idea_id)) or (goalpost_id is not null and (public.is_goal_collaborator(goalpost_id) or exists(select 1 from public.goal_collaborators gc where gc.goalpost_id = comments.goalpost_id and public.are_friends(auth.uid(), gc.user_id))) and not exists(select 1 from public.goal_collaborators gc where gc.goalpost_id = comments.goalpost_id and public.is_blocked_between(auth.uid(), gc.user_id)))));
create policy "authors update comments" on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors and content admins delete comments" on public.comments for delete to authenticated using (author_id = auth.uid() or (goalpost_id is not null and public.is_goal_admin(goalpost_id)) or (idea_id is not null and exists(select 1 from public.ideas i join public.idea_lists l on l.id = i.list_id where i.id = idea_id and l.owner_id = auth.uid())));

create policy "authorized attachments are readable" on public.attachments for select to anon, authenticated using (moderation_state = 'visible' and ((idea_id is not null and public.can_view_idea(idea_id)) or (goalpost_id is not null and exists(select 1 from public.goalposts g where g.id = goalpost_id and g.moderation_state = 'visible')) or (goal_update_id is not null and exists(select 1 from public.goal_updates u join public.goalposts g on g.id = u.goalpost_id where u.id = goal_update_id and u.moderation_state = 'visible' and g.moderation_state = 'visible'))) or public.is_platform_admin());
create policy "authorized users create attachments" on public.attachments for insert to authenticated with check (uploaded_by = auth.uid() and ((idea_id is not null and public.can_edit_idea(idea_id)) or (goalpost_id is not null and public.is_goal_collaborator(goalpost_id)) or (goal_update_id is not null and exists(select 1 from public.goal_updates u where u.id = goal_update_id and public.is_goal_collaborator(u.goalpost_id)))));
create policy "uploaders or admins delete attachments" on public.attachments for delete to authenticated using (uploaded_by = auth.uid() or (goalpost_id is not null and public.is_goal_admin(goalpost_id)) or public.is_platform_admin());

create policy "users manage own reminders" on public.reminders for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_goal_collaborator(goalpost_id));
create policy "users read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "authorized users read activity" on public.activity_logs for select to anon, authenticated using ((entity_type = 'goalpost' and exists(select 1 from public.goalposts g where g.id = entity_id and g.moderation_state = 'visible')) or (entity_type = 'list' and public.current_list_role(entity_id) is not null) or public.is_platform_admin());

create policy "users create reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and not public.is_suspended());
create policy "users read own reports" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_platform_admin());
create policy "admins update reports" on public.reports for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins read audit logs" on public.admin_audit_logs for select to authenticated using (public.is_platform_admin());
create policy "admins create audit logs" on public.admin_audit_logs for insert to authenticated with check (public.is_platform_admin() and admin_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'goalpost-media',
  'goalpost-media',
  false,
  26214400,
  array['image/jpeg','image/png','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain']
) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload immutable media paths" on storage.objects for insert to authenticated with check (bucket_id = 'goalpost-media' and (storage.foldername(name))[1] = auth.uid()::text and owner_id = auth.uid()::text);
create policy "authorized users access media" on storage.objects for select to anon, authenticated using (
  bucket_id = 'goalpost-media' and (
    owner_id = auth.uid()::text
    or exists(select 1 from public.profiles p where p.avatar_path = name and not public.is_suspended(p.id))
    or exists(select 1 from public.attachments a where a.storage_path = name and a.moderation_state = 'visible' and (
      (a.idea_id is not null and public.can_view_idea(a.idea_id))
      or (a.goalpost_id is not null and exists(select 1 from public.goalposts g where g.id = a.goalpost_id and g.moderation_state = 'visible'))
      or (a.goal_update_id is not null and exists(select 1 from public.goal_updates u join public.goalposts g on g.id = u.goalpost_id where u.id = a.goal_update_id and u.moderation_state = 'visible' and g.moderation_state = 'visible'))
    ))
  )
);
create policy "owners delete media" on storage.objects for delete to authenticated using (bucket_id = 'goalpost-media' and owner_id = auth.uid()::text);

create or replace function public.notify_goal_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
  select gc.user_id, new.author_id, 'goal_update', 'New progress on ' || g.title, 'A collaborator published a goalpost update.', '/g/' || g.public_id::text, 'goal-update:' || new.id::text || ':' || gc.user_id::text
  from public.goal_collaborators gc join public.goalposts g on g.id = gc.goalpost_id
  where gc.goalpost_id = new.goalpost_id and gc.user_id <> new.author_id
  on conflict (source_key) do nothing;
  return null;
end;
$$;

create or replace function public.notify_goal_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
  select gc.user_id, new.created_by, 'goal_event', 'New event: ' || new.title, 'A dated event was added to ' || g.title || '.', '/g/' || g.public_id::text, 'goal-event:' || new.id::text || ':' || gc.user_id::text
  from public.goal_collaborators gc join public.goalposts g on g.id = gc.goalpost_id
  where gc.goalpost_id = new.goalpost_id and gc.user_id <> new.created_by
  on conflict (source_key) do nothing;
  return null;
end;
$$;

create or replace function public.notify_task_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_user_id is not null and new.assignee_user_id <> new.created_by then
    insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
    select new.assignee_user_id, new.created_by, 'task_assigned', 'Task assigned: ' || new.title, 'You were assigned a public task on ' || g.title || '.', '/g/' || g.public_id::text, 'task-assigned:' || new.id::text
    from public.goalposts g where g.id = new.goalpost_id
    on conflict (source_key) do nothing;
  end if;
  return null;
end;
$$;

create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.goalpost_id is not null then
    insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
    select gc.user_id, new.author_id, 'goal_comment', 'New comment on ' || g.title, left(new.body, 240), '/g/' || g.public_id::text, 'goal-comment:' || new.id::text || ':' || gc.user_id::text
    from public.goal_collaborators gc join public.goalposts g on g.id = gc.goalpost_id
    where gc.goalpost_id = new.goalpost_id and gc.user_id <> new.author_id
    on conflict (source_key) do nothing;
  else
    insert into public.notifications(user_id, actor_id, notification_type, title, body, href, source_key)
    select lm.user_id, new.author_id, 'idea_comment', 'New comment on ' || i.title, left(new.body, 240), '/app/ideas/' || i.list_id::text || '?idea=' || i.id::text, 'idea-comment:' || new.id::text || ':' || lm.user_id::text
    from public.ideas i join public.list_members lm on lm.list_id = i.list_id
    where i.id = new.idea_id and lm.user_id <> new.author_id
    on conflict (source_key) do nothing;
  end if;
  return null;
end;
$$;

create trigger goal_updates_notify after insert on public.goal_updates for each row execute function public.notify_goal_update();
create trigger goal_events_notify after insert on public.goal_events for each row execute function public.notify_goal_event();
create trigger goal_tasks_notify after insert on public.goal_tasks for each row execute function public.notify_task_assignment();
create trigger comments_notify after insert on public.comments for each row execute function public.notify_comment();

create or replace function public.broadcast_user_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.broadcast_changes(
    'user:' || coalesce(new.user_id, old.user_id)::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create or replace function public.broadcast_list_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.broadcast_changes(
    'list:' || coalesce(new.list_id, old.list_id)::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create or replace function public.broadcast_goalpost_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.broadcast_changes(
    'goal:' || coalesce(new.id, old.id)::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create or replace function public.broadcast_goal_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.broadcast_changes(
    'goal:' || coalesce(new.goalpost_id, old.goalpost_id)::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create trigger notifications_broadcast after insert or update or delete on public.notifications for each row execute function public.broadcast_user_change();
create trigger ideas_broadcast after insert or update or delete on public.ideas for each row execute function public.broadcast_list_change();
create trigger goalposts_broadcast after insert or update or delete on public.goalposts for each row execute function public.broadcast_goalpost_change();
create trigger goal_updates_broadcast after insert or update or delete on public.goal_updates for each row execute function public.broadcast_goal_change();
create trigger goal_tasks_broadcast after insert or update or delete on public.goal_tasks for each row execute function public.broadcast_goal_change();
create trigger goal_events_broadcast after insert or update or delete on public.goal_events for each row execute function public.broadcast_goal_change();

create policy "members receive authorized broadcasts"
on realtime.messages for select to authenticated
using (
  case split_part(realtime.topic(), ':', 1)
    when 'user' then split_part(realtime.topic(), ':', 2)::uuid = auth.uid()
    when 'list' then public.current_list_role(split_part(realtime.topic(), ':', 2)::uuid) is not null
    when 'goal' then public.is_goal_collaborator(split_part(realtime.topic(), ':', 2)::uuid)
    else false
  end
);

commit;
