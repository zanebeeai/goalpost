-- Keep target dates to real calendar dates the app can show. Without this a
-- member could store 'infinity' or a five-digit year through the API.
alter table public.goals
  add constraint goals_target_date_range
  check (target_date between date '2000-01-01' and date '2999-12-31');
