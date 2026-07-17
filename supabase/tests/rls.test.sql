begin;
select plan(8);

insert into auth.users(id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-000000000011', 'rls-owner@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000012', 'rls-editor@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000013', 'rls-viewer@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000014', 'rls-stranger@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated');

insert into public.profiles(id, username, display_name) values
  ('00000000-0000-0000-0000-000000000011', 'rls_owner', 'RLS Owner'),
  ('00000000-0000-0000-0000-000000000012', 'rls_editor', 'RLS Editor'),
  ('00000000-0000-0000-0000-000000000013', 'rls_viewer', 'RLS Viewer'),
  ('00000000-0000-0000-0000-000000000014', 'rls_stranger', 'RLS Stranger');

insert into public.idea_lists(id, owner_id, title)
values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'RLS list');
insert into public.list_members(list_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'owner'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012', 'editor'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000013', 'viewer');
insert into public.ideas(id, list_id, title, created_by)
values ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'Original title', '00000000-0000-0000-0000-000000000011');
insert into public.goalposts(id, title, created_by, admin_user_id)
values ('30000000-0000-0000-0000-000000000011', 'Public RLS goal', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011');
insert into public.goal_collaborators(goalpost_id, user_id, is_admin)
values ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', true);

set local role anon;
select is(
  (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014'
  )),
  4::bigint,
  'anonymous visitors see visible profiles'
);
select is(
  (select count(*) from public.goalposts where id = '30000000-0000-0000-0000-000000000011'),
  1::bigint,
  'anonymous visitors see public goals'
);
select throws_ok('select * from public.ideas', '42501', 'permission denied for table ideas', 'anonymous visitors cannot query ideas');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.ideas), 1::bigint, 'list viewers can read ideas');
update public.ideas set title = 'Viewer changed this' where id = '20000000-0000-0000-0000-000000000011';
select is((select title from public.ideas where id = '20000000-0000-0000-0000-000000000011'), 'Original title', 'list viewers cannot update ideas');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
set local role authenticated;
update public.ideas set title = 'Editor changed this' where id = '20000000-0000-0000-0000-000000000011';
select is((select title from public.ideas where id = '20000000-0000-0000-0000-000000000011'), 'Editor changed this', 'list editors can update ideas');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000014","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.ideas), 0::bigint, 'unrelated members cannot read private ideas');
select throws_ok(
  $$insert into public.ideas(list_id, title, created_by) values ('10000000-0000-0000-0000-000000000011', 'Unauthorized', '00000000-0000-0000-0000-000000000014')$$,
  '42501',
  'new row violates row-level security policy for table "ideas"',
  'unrelated members cannot create ideas in a private list'
);

reset role;
select * from finish();
rollback;
