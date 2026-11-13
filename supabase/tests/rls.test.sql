-- RLS and RPC behaviour for the weekly learning schema.
-- Users: Tony (A) and Sam (B) share space S1. Olive (C) is alone in S2.
-- Dee (D) is alone in S3 and later joins S1.
begin;
create extension if not exists pgtap with schema extensions;
select plan(90);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'tony@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'sam@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'olive@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'dee@example.com');

insert into public.spaces (id, invite_code, timezone) values
  ('10000000-0000-0000-0000-000000000001', 'code-s1', 'UTC'),
  ('10000000-0000-0000-0000-000000000002', 'code-s2', 'UTC'),
  ('10000000-0000-0000-0000-000000000003', 'code-s3', 'UTC');

insert into public.profiles (id, space_id, display_name) values
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'Tony'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', 'Sam'),
  ('00000000-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000002', 'Olive'),
  ('00000000-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000003', 'Dee');

-- Sundays well in the past and well in the future, so "is it Friday yet"
-- has a fixed answer without mocking the clock.
create temporary table fixture_dates as
select
  (current_date - extract(dow from current_date)::int - 14) as past_week,
  (current_date - extract(dow from current_date)::int + 14) as future_week;
grant select on fixture_dates to anon, authenticated;

insert into public.weeks (id, user_id, week_start, topic, notes)
select '20000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-00000000000a'::uuid, past_week, 'Rust', 'notes'
from fixture_dates
union all
select '20000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-00000000000a'::uuid, future_week, 'Sourdough', ''
from fixture_dates
union all
select '20000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-00000000000c'::uuid, past_week, 'Olive secret', ''
from fixture_dates;

insert into public.questions (week_id, author_id, body) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'Past question'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'Future question');

insert into public.topics (space_id, added_by, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Chess'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000c', 'Olive topic');

insert into public.goals (id, user_id, title, target_date) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Run', current_date + 28),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'Read', current_date + 28),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c', 'Olive goal', current_date + 28);

insert into public.checkins (goal_id, week_start, body)
select '30000000-0000-0000-0000-000000000001'::uuid, past_week, 'Ran twice' from fixture_dates
union all
select '30000000-0000-0000-0000-000000000003'::uuid, past_week, 'Olive line' from fixture_dates;

-- ---------------------------------------------------------------------------
-- anon reads nothing
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok('select * from public.spaces', '42501', null, 'anon cannot read spaces');
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.weeks', '42501', null, 'anon cannot read weeks');
select throws_ok('select * from public.questions', '42501', null, 'anon cannot read questions');
select throws_ok('select * from public.topics', '42501', null, 'anon cannot read topics');
select throws_ok('select * from public.goals', '42501', null, 'anon cannot read goals');
select throws_ok('select * from public.checkins', '42501', null, 'anon cannot read check-ins');
select throws_ok($$select * from public.invite_preview('code-s1')$$, '42501', null, 'anon cannot call invite_preview');
select throws_ok($$select public.enter_space('Anon')$$, '42501', null, 'anon cannot call enter_space');

reset role;

-- ---------------------------------------------------------------------------
-- Olive (another space) reads nothing of ours
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);

select results_eq('select id from public.spaces', $$values ('10000000-0000-0000-0000-000000000002'::uuid)$$, 'outsider sees only their own space');
select results_eq('select display_name from public.profiles', $$values ('Olive')$$, 'outsider sees only their own profile');
select results_eq('select topic from public.weeks', $$values ('Olive secret')$$, 'outsider sees only their own weeks');
select is((select count(*) from public.questions), 0::bigint, 'outsider sees none of our questions');
select results_eq('select title from public.topics', $$values ('Olive topic')$$, 'outsider sees only their own topic list');
select results_eq('select title from public.goals', $$values ('Olive goal')$$, 'outsider sees only their own goals');
select results_eq('select body from public.checkins', $$values ('Olive line')$$, 'outsider sees only their own check-ins');
select throws_ok(
  $$insert into public.questions (week_id, body) values ('20000000-0000-0000-0000-000000000001', 'Sneaky')$$,
  '42501', null, 'outsider cannot write a question on our week');
select throws_ok(
  $$insert into public.topics (space_id, title) values ('10000000-0000-0000-0000-000000000001', 'Sneaky')$$,
  '42501', null, 'outsider cannot add to our topic list');
select is(
  (select count(*) from public.invite_preview('code-s1')), 2::bigint,
  'a signed-in invitee can preview the names in a space');
select is(
  (select count(*) from public.invite_preview('no-such-code')), 0::bigint,
  'an invalid code previews nothing');

-- Deletes and updates on other spaces' rows silently match nothing.
delete from public.topics where space_id = '10000000-0000-0000-0000-000000000001';
update public.weeks set topic = 'Hacked' where id = '20000000-0000-0000-0000-000000000001';
update public.goals set target_date = current_date + 300 where id = '30000000-0000-0000-0000-000000000001';
reset role;
select is((select target_date from public.goals where id = '30000000-0000-0000-0000-000000000001'), current_date + 28, 'outsider cannot change our goal dates');
select is((select count(*) from public.topics where space_id = '10000000-0000-0000-0000-000000000001'), 1::bigint, 'outsider cannot delete our topics');
select is((select topic from public.weeks where id = '20000000-0000-0000-0000-000000000001'), 'Rust', 'outsider cannot edit our weeks');

-- ---------------------------------------------------------------------------
-- Sam, Tony's space mate
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select is((select count(*) from public.profiles), 2::bigint, 'space mates see both profiles');
select is((select count(*) from public.weeks), 2::bigint, 'space mates read each other''s weeks');
select is((select count(*) from public.goals), 2::bigint, 'space mates read each other''s goals');
select is((select count(*) from public.checkins), 1::bigint, 'space mates read each other''s check-ins');
select is((select count(*) from public.topics), 1::bigint, 'space mates share the topic list');
select is((select count(*) from public.questions), 2::bigint, 'an author always reads their own questions');
select lives_ok(
  $$insert into public.questions (week_id, body) values ('20000000-0000-0000-0000-000000000002', 'Another one')$$,
  'a space mate can question someone else''s week');
select lives_ok(
  $$insert into public.weeks (week_start, topic) select future_week, 'Sam topic' from fixture_dates$$,
  'a member can create their own week');
select throws_ok(
  $$insert into public.weeks (user_id, week_start, topic) select '00000000-0000-0000-0000-00000000000a', future_week + 7, 'Forged' from fixture_dates$$,
  '42501', null, 'a member cannot create a week for someone else');
select throws_ok(
  $$insert into public.goals (user_id, title, target_date) values ('00000000-0000-0000-0000-00000000000a', 'Forged', current_date + 7)$$,
  '42501', null, 'a member cannot create a goal for someone else');
with changed as (
  update public.goals set target_date = current_date + 300
  where id = '30000000-0000-0000-0000-000000000001'
  returning id
)
select is((select count(*) from changed), 0::bigint, 'a space mate cannot change someone else''s goal date');
select throws_ok(
  $$insert into public.checkins (goal_id, week_start, body) select '30000000-0000-0000-0000-000000000002', past_week, 'Forged' from fixture_dates$$,
  '42501', null, 'a member cannot check in on someone else''s goal');

-- ---------------------------------------------------------------------------
-- Tony, the owner of the interviewed weeks
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select results_eq(
  $$select body from public.questions where week_id = '20000000-0000-0000-0000-000000000001'$$,
  $$values ('Past question')$$,
  'the owner reads questions once Friday of that week has passed');
select is(
  (select count(*) from public.questions where week_id = '20000000-0000-0000-0000-000000000002'),
  0::bigint,
  'the owner cannot read questions before Friday');
select throws_ok(
  $$insert into public.questions (week_id, body) values ('20000000-0000-0000-0000-000000000001', 'Self question')$$,
  '42501', null, 'a member cannot write a question on their own week');
select throws_ok(
  $$update public.profiles set space_id = '10000000-0000-0000-0000-000000000002' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'a member cannot update profiles.space_id');
select throws_ok(
  $$update public.profiles set last_nudged_on = current_date where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'a member cannot update profiles.last_nudged_on');
select lives_ok(
  $$update public.profiles set display_name = 'Tony P', email_nudges = false where id = '00000000-0000-0000-0000-00000000000a'$$,
  'a member can update their own name and nudge setting');
select throws_ok(
  $$insert into public.goals (title) values ('No date')$$,
  '23502', null, 'a goal needs a target date');
-- Dates the app could not show are refused, on insert and on update.
select throws_ok(
  format($$insert into public.goals (title, target_date) values ('Bad date', %L)$$, bad),
  '23514', null, 'insert refuses target_date ' || bad)
from (values ('infinity'), ('20000-01-01'), ('0001-01-01 BC'), ('1900-01-01')) as v(bad);
select throws_ok(
  format($$update public.goals set target_date = %L where id = '30000000-0000-0000-0000-000000000001'$$, bad),
  '23514', null, 'update refuses target_date ' || bad)
from (values ('infinity'), ('20000-01-01'), ('0001-01-01 BC'), ('1900-01-01')) as v(bad);
select lives_ok(
  $$update public.goals set target_date = current_date + 60 where id = '30000000-0000-0000-0000-000000000001'$$,
  'the owner can change a goal''s target date');
select is(
  (select target_date from public.goals where id = '30000000-0000-0000-0000-000000000001'),
  current_date + 60, 'the new target date is stored');
select lives_ok(
  $$insert into public.goals (title, target_date) values ('Third goal', current_date + 28)$$,
  'a third active goal is allowed');
select throws_ok(
  $$insert into public.goals (title, target_date) values ('Fourth goal', current_date + 28)$$,
  'P0001', 'You can keep three goals going at once. Finish or drop one first.',
  'the fourth active goal is rejected');
select lives_ok(
  $$update public.goals set finished_at = now() where id = '30000000-0000-0000-0000-000000000002'$$,
  'finishing a goal frees a slot');
select lives_ok(
  $$insert into public.goals (title, target_date) values ('Fourth goal', current_date + 28)$$,
  'a new goal fits after finishing one');
select throws_ok(
  $$update public.goals set finished_at = null where id = '30000000-0000-0000-0000-000000000002'$$,
  'P0001', null, 'reopening a goal cannot exceed the limit');
select lives_ok(
  $$update public.goals set target_date = current_date + 90 where id = '30000000-0000-0000-0000-000000000001'$$,
  'a goal at the limit can still change its date');
select throws_ok(
  $$select public.enter_space('Tony again')$$,
  '23505', 'You are already set up.', 'enter_space refuses an existing member');
select isnt(
  (select public.rotate_invite()), 'code-s1',
  'rotate_invite issues a new code');
select throws_ok(
  $$select public.set_space_timezone('Not/AZone')$$,
  '22023', 'Pick a timezone from the list.',
  'set_space_timezone rejects unknown zones');
select throws_ok(
  $$select public.set_space_timezone('pacific/kiritimati')$$,
  '22023', null,
  'set_space_timezone rejects non-canonical spellings instead of storing UTC');

-- Tony is at the limit now. Forged writes from others hit RLS, never the
-- limit message, so they learn nothing about how many goals Tony has.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.goals (user_id, title, target_date) values ('00000000-0000-0000-0000-00000000000a', 'Forged', current_date + 7)$$,
  '42501', null, 'an outsider''s forged goal fails on RLS, not the limit');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.goals (user_id, title, target_date) values ('00000000-0000-0000-0000-00000000000a', 'Forged', current_date + 7)$$,
  '42501', null, 'a space mate''s forged goal fails on RLS, not the limit');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- The reveal instant is frozen when the week is created
-- ---------------------------------------------------------------------------
reset role;
update public.spaces set timezone = 'Pacific/Pago_Pago'
where id = '10000000-0000-0000-0000-000000000001';
insert into public.weeks (id, user_id, week_start, topic)
select '20000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-00000000000a'::uuid, future_week + 7, 'Frozen'
from fixture_dates;
select is(
  (select reveals_at from public.weeks where id = '20000000-0000-0000-0000-000000000004'),
  (select (future_week + 12)::timestamp at time zone 'Pacific/Pago_Pago' from fixture_dates),
  'reveals_at is Friday midnight in the space timezone at creation');
-- Model "Friday starts in an hour" in the original timezone.
update public.weeks set reveals_at = now() + interval '1 hour'
where id = '20000000-0000-0000-0000-000000000004';
insert into public.questions (week_id, author_id, body) values
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000b', 'Almost Friday');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(
  (select public.set_space_timezone('Pacific/Kiritimati')), 'Pacific/Kiritimati',
  'a member can change the space timezone');
select is(
  (select count(*) from public.questions where week_id = '20000000-0000-0000-0000-000000000004'),
  0::bigint,
  'changing the space timezone does not reveal questions early');
select throws_ok(
  $$update public.weeks set reveals_at = now() - interval '1 day' where id = '20000000-0000-0000-0000-000000000004'$$,
  '42501', null, 'members cannot move the reveal instant');
reset role;
select is(
  (select reveals_at > now() from public.weeks where id = '20000000-0000-0000-0000-000000000004'),
  true,
  'the reveal instant did not move with the timezone');
update public.spaces set timezone = 'Pacific/Pago_Pago' where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- Switch far east, pick, switch back: the reveal must end up at the western Friday.
select lives_ok($$select public.set_space_timezone('Pacific/Kiritimati')$$, 'switch the space far east');
select lives_ok(
  $$insert into public.weeks (id, week_start, topic) select '20000000-0000-0000-0000-000000000006'::uuid, future_week + 14, 'East' from fixture_dates$$,
  'pick a topic while the space is far east');
select lives_ok($$select public.set_space_timezone('Pacific/Pago_Pago')$$, 'switch the space back west');
select is(
  (select reveals_at from public.weeks where id = '20000000-0000-0000-0000-000000000006'),
  (select (future_week + 19)::timestamp at time zone 'Pacific/Pago_Pago' from fixture_dates),
  'switching east and back cannot freeze an early reveal');
select throws_ok(
  $$select public.set_space_timezone('posix/Pacific/Kiritimati')$$,
  '22023', null, 'set_space_timezone rejects posix/* zones Intl does not know');
select throws_ok(
  $$select public.set_space_timezone('Factory')$$,
  '22023', null, 'set_space_timezone rejects Factory');

reset role;
update public.spaces set timezone = 'UTC' where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Dee joins Tony's space; her old empty space is removed
-- ---------------------------------------------------------------------------
reset role;
update public.spaces set invite_code = 'code-s1' where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);

select is(
  (select public.join_space('code-s1')), '10000000-0000-0000-0000-000000000001'::uuid,
  'join_space returns the joined space');
select is((select count(*) from public.profiles), 3::bigint, 'the joiner now sees the new space''s members');
select throws_ok(
  $$select public.join_space('no-such-code')$$,
  'P0002', 'That invite link is no longer valid.', 'join_space rejects an invalid code');

reset role;
select is(
  (select space_id from public.profiles where id = '00000000-0000-0000-0000-00000000000d'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'join_space moves the member');
select is(
  (select count(*) from public.spaces where id = '10000000-0000-0000-0000-000000000003'),
  0::bigint,
  'join_space removes the emptied space');

-- ---------------------------------------------------------------------------
-- Questions do not follow a member who moves to another space
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000e', 'eve@example.com'),
  ('00000000-0000-0000-0000-00000000000f', 'fay@example.com');
insert into public.profiles (id, space_id, display_name) values
  ('00000000-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000002', 'Eve');
insert into public.weeks (id, user_id, week_start, topic)
select '20000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-00000000000c'::uuid, future_week, 'Olive future'
from fixture_dates;
insert into public.questions (week_id, author_id, body) values
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000e', 'Eve past question'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000e', 'Eve future question');

-- Tony's space is now further west than Olive's (UTC).
update public.spaces set timezone = 'Pacific/Pago_Pago' where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select lives_ok($$select public.join_space('code-s1')$$, 'Olive moves to Tony''s space');
select is(
  (select reveals_at from public.weeks where id = '20000000-0000-0000-0000-000000000005'),
  (select (future_week + 5)::timestamp at time zone 'Pacific/Pago_Pago' from fixture_dates),
  'moving to a space further west pushes an unrevealed week''s reveal later');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  (select count(*) from public.weeks where user_id = '00000000-0000-0000-0000-00000000000c'),
  2::bigint, 'the mover''s weeks come with them');
select is(
  (select count(*) from public.questions
   where week_id in ('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005')),
  0::bigint,
  'new space mates cannot read questions written by the mover''s old space');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select results_eq(
  $$select body from public.questions
    where week_id in ('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005')$$,
  $$values ('Eve past question')$$,
  'the owner still reads old questions after the reveal, and not before');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select is((select count(*) from public.questions), 2::bigint, 'the author still reads their own questions');
select is((select count(*) from public.weeks), 0::bigint, 'the old space no longer sees the mover''s weeks');

-- ---------------------------------------------------------------------------
-- A space with no members cannot be entered
-- ---------------------------------------------------------------------------
reset role;
insert into public.spaces (id, invite_code) values
  ('10000000-0000-0000-0000-000000000005', 'code-empty');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select throws_ok(
  $$select public.enter_space('Fay', 'UTC', 'code-empty')$$,
  'P0002', 'That invite link is no longer valid.',
  'enter_space refuses a space with no members');
select lives_ok(
  $$select public.enter_space('Fay', 'UTC')$$,
  'enter_space without a code creates a new space');
select throws_ok(
  $$select public.join_space('code-empty')$$,
  'P0002', 'That invite link is no longer valid.',
  'join_space refuses a space with no members');

select * from finish();
rollback;
