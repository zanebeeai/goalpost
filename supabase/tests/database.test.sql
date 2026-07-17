begin;
select plan(22);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'idea_lists', 'idea lists table exists');
select has_table('public', 'ideas', 'ideas table exists');
select has_table('public', 'goalposts', 'goalposts table exists');
select has_table('public', 'reminders', 'reminders table exists');
select has_function('public', 'promote_idea', array['uuid'], 'promotion RPC exists');
select has_function('public', 'prepare_account_deletion', array[]::text[], 'deletion preparation RPC exists');
select ok(has_table_privilege('anon', 'public.profiles', 'select'), 'anonymous visitors can query public profiles through RLS');
select ok(has_table_privilege('authenticated', 'public.ideas', 'insert'), 'authenticated members can create authorized ideas through RLS');

insert into auth.users(id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'editor@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'viewer@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'stranger@example.com', '', now(), '{}', '{}', 'authenticated', 'authenticated');

insert into public.profiles(id, username, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'owner', 'Owner'),
  ('00000000-0000-0000-0000-000000000002', 'editor', 'Editor'),
  ('00000000-0000-0000-0000-000000000003', 'viewer', 'Viewer'),
  ('00000000-0000-0000-0000-000000000004', 'stranger', 'Stranger');

insert into public.idea_lists(id, owner_id, title) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Shared ideas');
insert into public.list_members(list_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'editor'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'viewer');
insert into public.ideas(id, list_id, title, created_by) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Build a radio', '00000000-0000-0000-0000-000000000001');

select is(public.current_list_role('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')::text, 'owner', 'owner role resolves');
select is(public.current_list_role('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')::text, 'editor', 'editor role resolves');
select is(public.current_list_role('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003')::text, 'viewer', 'viewer role resolves');
select is(public.current_list_role('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004')::text, null, 'stranger has no list role');
select ok(public.can_edit_idea('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'), 'owner can edit');
select ok(public.can_edit_idea('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'), 'editor can edit');
select ok(not public.can_edit_idea('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'), 'viewer cannot edit');
select ok(public.can_view_idea('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'), 'viewer can read');
select ok(not public.can_view_idea('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'), 'stranger cannot read idea');

insert into public.goalposts(id, title, created_by, admin_user_id) values ('30000000-0000-0000-0000-000000000001', 'Public radio', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.goal_collaborators(goalpost_id, user_id, is_admin) values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true);
select ok(public.is_goal_collaborator('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'), 'goal collaborator recognized');
select ok(public.is_goal_admin('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'), 'goal admin recognized');
insert into public.goal_collaborators(goalpost_id, user_id) values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
insert into public.goal_updates(goalpost_id, author_id, content) values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"type":"doc","content":[]}'::jsonb);
select is((select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-000000000002' and notification_type = 'goal_update'), 1::bigint, 'goal updates notify other collaborators');
insert into public.goal_events(goalpost_id, title, starts_at, created_by) values ('30000000-0000-0000-0000-000000000001', 'Parts arrive', now() + interval '1 day', '00000000-0000-0000-0000-000000000001');
select is((select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-000000000002' and notification_type = 'goal_event'), 1::bigint, 'goal events notify other collaborators');

select * from finish();
rollback;
