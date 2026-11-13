-- Goals v2: every goal has a target date, and a member may keep three going.

alter table public.goals add column target_date date;

-- Existing goals get four weeks from the day they were created, in the
-- owner's space timezone.
update public.goals g
set target_date = (g.created_at at time zone s.timezone)::date + 28
from public.profiles p
join public.spaces s on s.id = p.space_id
where p.id = g.user_id;

alter table public.goals alter column target_date set not null;

grant update (target_date) on public.goals to authenticated;

create or replace function public.enforce_goal_limit()
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
  ) >= 3 then
    raise exception 'You can keep three goals going at once. Finish or drop one first.'
      using errcode = 'P0001';
  end if;
  return new;
end
$$;
