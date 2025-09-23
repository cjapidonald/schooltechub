-- Skip inserting newsletter subscribers that already exist
INSERT INTO public.newsletter_subscribers (email, name, role, segments, status, locale)
VALUES 
  ('educator2@example.com', 'Dr. Lisa Garcia', 'Teacher', ARRAY['research', 'innovation'], 'subscribed', 'en'),
  ('principal@school.org', 'John Anderson', 'Admin', ARRAY['leadership', 'policy'], 'subscribed', 'en'),
  ('teacher3@academy.edu', 'Robert Wilson', 'Teacher', ARRAY['stem', 'technology'], 'subscribed', 'en')
ON CONFLICT (email) DO NOTHING;

-- Add sample profiles for testing (if they don't exist)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  gen_random_uuid(),
  'demo.teacher@example.com',
  'Demo Teacher',
  'Teacher'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'demo.teacher@example.com'
);

-- Create builder collections with some items
INSERT INTO public.builder_collections (name, description, anon_user_id)
VALUES 
  ('My Favorite Activities', 'Collection of go-to classroom activities', 'anon-collection-user-1'),
  ('STEM Resources', 'Science and technology teaching materials', 'anon-collection-user-2'),
  ('Language Arts Bundle', 'Reading and writing resources', 'anon-collection-user-3');

-- Add items to collections (linking to the activities we created)
INSERT INTO public.builder_collection_items (collection_id, activity_slug, position)
SELECT 
  c.id,
  'math-warm-up',
  1
FROM public.builder_collections c
WHERE c.name = 'My Favorite Activities'
LIMIT 1;

INSERT INTO public.builder_collection_items (collection_id, activity_slug, position)
SELECT 
  c.id,
  'science-experiment-volcano',
  2
FROM public.builder_collections c
WHERE c.name = 'My Favorite Activities'
LIMIT 1;

INSERT INTO public.builder_collection_items (collection_id, activity_slug, position)
SELECT 
  c.id,
  'science-experiment-volcano',
  1
FROM public.builder_collections c
WHERE c.name = 'STEM Resources'
LIMIT 1;

INSERT INTO public.builder_collection_items (collection_id, activity_slug, position)
SELECT 
  c.id,
  'coding-basics',
  2
FROM public.builder_collections c
WHERE c.name = 'STEM Resources'
LIMIT 1;

-- Add some recent activity views
INSERT INTO public.builder_activity_recents (anon_user_id, activity_slug, last_viewed, metadata)
VALUES 
  ('anon-recent-user-1', 'math-warm-up', NOW() - INTERVAL '2 hours', '{"viewed_from": "search"}'),
  ('anon-recent-user-1', 'reading-circle', NOW() - INTERVAL '1 day', '{"viewed_from": "browse"}'),
  ('anon-recent-user-2', 'science-experiment-volcano', NOW() - INTERVAL '3 hours', '{"viewed_from": "featured"}');

-- Add some favorite activities
INSERT INTO public.builder_activity_favorites (anon_user_id, activity_slug)
VALUES 
  ('anon-fav-user-1', 'math-warm-up'),
  ('anon-fav-user-1', 'reading-circle'),
  ('anon-fav-user-2', 'science-experiment-volcano'),
  ('anon-fav-user-2', 'coding-basics');

-- Add sample comments on some content
INSERT INTO public.comments (content, content_id)
SELECT 
  'This AI article really opened my eyes to the possibilities!',
  id
FROM public.content_master 
WHERE slug = 'future-ai-education'
LIMIT 1;

INSERT INTO public.comments (content, content_id)
SELECT 
  'Great tips on gamification. I tried this in my class and it worked wonderfully.',
  id
FROM public.content_master 
WHERE slug = 'gamification-classroom'
LIMIT 1;

INSERT INTO public.comments (content, content_id)
SELECT 
  'The flipped classroom model has been a game-changer for our school.',
  id
FROM public.content_master 
WHERE slug = 'flipped-classroom-success'
LIMIT 1;

-- Add some link health reports for resources
INSERT INTO public.builder_link_health_reports (url, is_healthy, status_code, status_text, last_checked)
VALUES 
  ('https://example.com/resource1.pdf', true, 200, 'OK', NOW()),
  ('https://example.com/resource2.ppt', true, 200, 'OK', NOW() - INTERVAL '1 day'),
  ('https://example.com/broken-link.doc', false, 404, 'Not Found', NOW() - INTERVAL '2 hours'),
  ('https://educational-site.org/worksheet.pdf', true, 200, 'OK', NOW() - INTERVAL '3 days');

-- Add sample resource links
INSERT INTO public.builder_resource_links (url, is_healthy, status_code, status_text, last_checked)
VALUES 
  ('https://educationresource.com/math-games', true, 200, 'OK', NOW()),
  ('https://sciencevideos.edu/photosynthesis', true, 200, 'OK', NOW() - INTERVAL '1 day'),
  ('https://historychannel.com/ancient-civilizations', true, 200, 'OK', NOW() - INTERVAL '2 days');