-- Quick manual verification script for the RLS policies introduced in 20251105000000_update_rls_policies.sql
-- Run inside a transaction so test data is discarded automatically.
BEGIN;

-- Seed baseline data with admin privileges
SELECT set_config('request.jwt.claims', '{"role":"admin","sub":"00000000-0000-0000-0000-000000000000"}', true);

INSERT INTO public.classes (id, name, owner_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'Example Class', '00000000-0000-0000-0000-000000000101');

INSERT INTO public.class_members (id, class_id, user_id, role)
VALUES ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'teacher');

INSERT INTO public.lesson_plans (id, owner_id, title)
VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000201', 'Sample Plan');

INSERT INTO public.lesson_plan_steps (id, lesson_plan_id, position, title)
VALUES ('32222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 'Warm up');

INSERT INTO public.class_lesson_plans (id, class_id, lesson_plan_id, added_by)
VALUES ('42222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000101');

INSERT INTO public.saved_posts (id, user_id, post_id)
VALUES ('51111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', '99999999-9999-9999-9999-999999999999');

INSERT INTO public.notifications (id, user_id, type, payload)
VALUES ('61111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000102', 'resource_approved', '{}'::jsonb);

INSERT INTO public.notification_prefs (user_id)
VALUES ('00000000-0000-0000-0000-000000000102')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.research_projects (id, title, slug, summary, status, visibility, created_by)
VALUES ('71111111-1111-1111-1111-111111111111', 'Literacy Study', 'literacy-study', 'Exploring literacy', 'open', 'list_public', '00000000-0000-0000-0000-000000000301');

INSERT INTO public.research_participants (id, project_id, user_id)
VALUES ('81111111-1111-1111-1111-111111111111', '71111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000302');

INSERT INTO public.research_documents (id, project_id, title)
VALUES ('82111111-1111-1111-1111-111111111111', '71111111-1111-1111-1111-111111111111', 'Consent Form');

INSERT INTO public.research_applications (id, project_id, applicant_id, status)
VALUES ('83111111-1111-1111-1111-111111111111', '71111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000302', 'pending');

INSERT INTO public.research_submissions (id, project_id, participant_id, title)
VALUES ('84111111-1111-1111-1111-111111111111', '71111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000302', 'Initial Report');

-- Reset claims between scenarios
SELECT set_config('request.jwt.claims', NULL, true);

-- === Classes ===
-- Owner can read/update
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}', true);
SELECT id FROM public.classes WHERE id = '11111111-1111-1111-1111-111111111111'; -- expect success

-- Member can read via membership
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}', true);
SELECT id FROM public.classes WHERE id = '11111111-1111-1111-1111-111111111111'; -- expect success

-- Outsider blocked from reading
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000103"}', true);
SELECT id FROM public.classes WHERE id = '11111111-1111-1111-1111-111111111111'; -- expect ERROR: permission denied

-- Outsider blocked from inserting membership
INSERT INTO public.class_members (class_id, user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000103', 'assistant'); -- expect ERROR: permission denied

-- Member can read their own membership but not others
SELECT id FROM public.class_members WHERE user_id = '00000000-0000-0000-0000-000000000102'; -- expect success
SELECT id FROM public.class_members WHERE user_id = '00000000-0000-0000-0000-000000000101'; -- expect zero rows (no permission)

-- === Lesson plans ===
-- Plan owner can read
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000201"}', true);
SELECT id FROM public.lesson_plans WHERE id = '22222222-2222-2222-2222-222222222222'; -- expect success

-- Class member linked to plan can read
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}', true);
SELECT id FROM public.lesson_plans WHERE id = '22222222-2222-2222-2222-222222222222'; -- expect success

-- Outsider blocked
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000103"}', true);
SELECT id FROM public.lesson_plans WHERE id = '22222222-2222-2222-2222-222222222222'; -- expect ERROR: permission denied

-- === Saved posts ===
SELECT id FROM public.saved_posts WHERE user_id = '00000000-0000-0000-0000-000000000102'; -- expect success
SELECT id FROM public.saved_posts WHERE user_id = '00000000-0000-0000-0000-000000000101'; -- expect zero rows (no permission)

-- === Notifications ===
UPDATE public.notifications SET is_read = true WHERE id = '61111111-1111-1111-1111-111111111111'; -- expect success
INSERT INTO public.notifications (user_id, type, payload)
VALUES ('00000000-0000-0000-0000-000000000102', 'resource_approved', '{}'::jsonb); -- expect ERROR: permission denied

-- === Research documents ===
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000302"}', true);
SELECT id FROM public.research_documents WHERE id = '82111111-1111-1111-1111-111111111111'; -- expect success

SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000303"}', true);
SELECT id FROM public.research_documents WHERE id = '82111111-1111-1111-1111-111111111111'; -- expect ERROR: permission denied

-- === Research applications ===
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000302"}', true);
SELECT id FROM public.research_applications WHERE id = '83111111-1111-1111-1111-111111111111'; -- expect success

SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000303"}', true);
SELECT id FROM public.research_applications WHERE id = '83111111-1111-1111-1111-111111111111'; -- expect ERROR: permission denied

-- === Research participants ===
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000302"}', true);
SELECT id FROM public.research_participants WHERE project_id = '71111111-1111-1111-1111-111111111111'; -- expect success (own row)

SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000301"}', true);
SELECT id FROM public.research_participants WHERE project_id = '71111111-1111-1111-1111-111111111111'; -- expect success (project owner)

SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000303"}', true);
SELECT id FROM public.research_participants WHERE project_id = '71111111-1111-1111-1111-111111111111'; -- expect ERROR: permission denied

-- === Research submissions ===
SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000302"}', true);
SELECT id FROM public.research_submissions WHERE id = '84111111-1111-1111-1111-111111111111'; -- expect success

SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000303"}', true);
SELECT id FROM public.research_submissions WHERE id = '84111111-1111-1111-1111-111111111111'; -- expect ERROR: permission denied

-- Clean up
ROLLBACK;
