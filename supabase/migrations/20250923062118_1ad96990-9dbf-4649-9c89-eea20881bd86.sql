-- Sample data for tools_activities table
INSERT INTO public.tools_activities (slug, name, description, duration_minutes, instructions, subjects, grade_levels, tags, learning_objectives, materials)
VALUES 
  ('math-warm-up', 'Math Warm-Up Challenge', 'Quick mental math exercises to start the class', 10, 
   'Display problems on the board and have students solve them mentally', 
   ARRAY['Math'], ARRAY['Primary', 'Secondary'], ARRAY['warm-up', 'mental-math'], 
   ARRAY['Improve mental calculation speed', 'Build number sense'], 
   ARRAY['Whiteboard', 'Timer']),
  
  ('science-experiment-volcano', 'Volcano Eruption Experiment', 'Create a model volcano that erupts using baking soda and vinegar', 30,
   '1. Build volcano structure with clay\n2. Place container in center\n3. Add baking soda\n4. Pour vinegar and watch eruption',
   ARRAY['Science', 'Chemistry'], ARRAY['Primary'], ARRAY['experiment', 'hands-on', 'chemistry'],
   ARRAY['Understand chemical reactions', 'Learn about volcanoes'], 
   ARRAY['Baking soda', 'Vinegar', 'Clay', 'Food coloring']),
  
  ('reading-circle', 'Reading Circle Discussion', 'Students take turns reading and discussing a story', 45,
   'Form groups of 4-5 students. Each takes a role: reader, summarizer, questioner, connector',
   ARRAY['English'], ARRAY['Primary', 'Secondary'], ARRAY['reading', 'discussion', 'collaborative'],
   ARRAY['Improve reading comprehension', 'Develop discussion skills'],
   ARRAY['Books', 'Discussion cards']);

-- Sample data for classes table
INSERT INTO public.classes (title, description, instructor_name, subject, level, status, start_date, end_date, meeting_schedule, max_capacity, image_url)
VALUES 
  ('Advanced Mathematics', 'Explore algebra, geometry, and calculus concepts', 'Dr. Sarah Johnson', 'Math', 'Secondary', 'active', 
   '2025-01-15', '2025-05-30', 'Mon/Wed/Fri 10:00 AM', 25, null),
  
  ('Creative Writing Workshop', 'Develop your storytelling and writing skills', 'Prof. Michael Chen', 'English', 'High School', 'upcoming',
   '2025-02-01', '2025-04-15', 'Tue/Thu 2:00 PM', 20, null),
  
  ('Introduction to Biology', 'Basic concepts in life sciences', 'Ms. Emily Davis', 'Biology', 'Secondary', 'active',
   '2025-01-10', '2025-06-15', 'Mon/Wed 1:00 PM', 30, null);

-- Sample data for resources table
INSERT INTO public.resources (title, description, type, subject, stage, resource_type, grade_level, format, tags, status, creator_id)
VALUES 
  ('Fraction Worksheets Pack', 'Comprehensive worksheets for teaching fractions', 'document', 'Math', 'Primary', 'Worksheets', 'Grade 3-5', 'PDF',
   ARRAY['fractions', 'practice', 'printable'], 'approved', null),
  
  ('Solar System Presentation', 'Interactive slides about planets and space', 'presentation', 'Science', 'Secondary', 'Slides', 'Grade 6-8', 'PowerPoint',
   ARRAY['space', 'planets', 'astronomy'], 'approved', null),
  
  ('Grammar Rules Poster Set', 'Visual aids for common grammar rules', 'image', 'English', 'Primary', 'Posters', 'Grade 2-4', 'PDF',
   ARRAY['grammar', 'visual-aids', 'classroom-decor'], 'approved', null),
  
  ('Chemistry Lab Safety Video', 'Essential safety procedures for lab work', 'video', 'Chemistry', 'High School', 'Videos', 'Grade 9-12', 'MP4',
   ARRAY['safety', 'lab', 'chemistry'], 'approved', null);

-- Sample data for content_master table (blog posts, events, etc.)
INSERT INTO public.content_master (
  content_type, page, title, slug, excerpt, content, 
  is_published, published_at, tags, subject, stage, 
  author, featured_image, read_time, view_count
)
VALUES 
  ('blog', 'research_blog', 'The Future of AI in Education', 'future-ai-education',
   'Exploring how artificial intelligence is transforming the classroom experience',
   '{"blocks": [{"type": "paragraph", "text": "AI is revolutionizing education through personalized learning paths..."}]}',
   true, NOW() - INTERVAL '3 days', ARRAY['AI', 'EdTech', 'Innovation'], 
   null, null, '{"name": "Dr. Rachel Smith", "title": "Education Researcher"}',
   null, 8, 245),
  
  ('event', 'events', 'STEM Education Summit 2025', 'stem-summit-2025',
   'Join educators worldwide for the biggest STEM education conference',
   '{"blocks": [{"type": "paragraph", "text": "Three days of workshops, keynotes, and networking..."}]}',
   true, NOW() - INTERVAL '1 week', ARRAY['STEM', 'Conference', 'Professional Development'],
   null, 'K-12', '{"name": "Education Council", "title": "Event Organizer"}',
   null, 5, 892),
  
  ('teaching_technique', 'research_blog', 'Gamification in the Classroom', 'gamification-classroom',
   'How to use game elements to boost student engagement',
   '{"blocks": [{"type": "paragraph", "text": "Gamification introduces game-like elements into learning..."}]}',
   true, NOW() - INTERVAL '10 days', ARRAY['Gamification', 'Engagement', 'Teaching Tips'],
   null, 'Primary', '{"name": "Tom Wilson", "title": "Master Teacher"}',
   null, 12, 567);

-- Add event-specific data
UPDATE public.content_master 
SET 
  start_datetime = '2025-03-15 09:00:00'::timestamptz,
  end_datetime = '2025-03-17 17:00:00'::timestamptz,
  event_type = 'Workshop',
  event_mode = 'Hybrid',
  event_status = 'Upcoming',
  event_capacity = 500,
  event_registered = 127,
  venue = 'Education Convention Center, New York',
  event_host = 'Global Education Foundation',
  registration_url = 'https://example.com/register'
WHERE slug = 'stem-summit-2025';

-- Sample FAQ data
INSERT INTO public.faq (question, answer, page, tags, display_order, is_published)
VALUES 
  ('How do I create my first lesson plan?', 
   'Click on the Builder tab in the navigation menu, then follow the step-by-step guide to add activities, resources, and learning objectives.',
   null, ARRAY['getting-started', 'lesson-planning'], 1, true),
  
  ('Can I share resources with other teachers?',
   'Yes! You can upload resources to our community library where other educators can discover and use them in their classrooms.',
   null, ARRAY['resources', 'sharing'], 2, true),
  
  ('What file formats are supported for uploads?',
   'We support PDF, Word documents, PowerPoint presentations, images (JPG, PNG), and video files (MP4, MOV) up to 100MB.',
   null, ARRAY['uploads', 'technical'], 3, true);

-- Sample testimonials
INSERT INTO public.testimonials (name, job_title, organization, content, rating, consent, is_featured, page)
VALUES 
  ('Sarah Mitchell', 'Math Teacher', 'Lincoln High School', 
   'This platform has transformed how I plan and deliver lessons. The resource library saves me hours every week!',
   5, true, true, null),
  
  ('James Rodriguez', 'Science Department Head', 'Riverside Middle School',
   'The collaboration features help our department stay aligned and share best practices effortlessly.',
   5, true, false, null),
  
  ('Dr. Amanda Foster', 'Principal', 'Oakwood Elementary',
   'Since implementing this platform, we have seen significant improvements in teacher satisfaction and student engagement.',
   5, true, true, null);

-- Sample newsletter subscribers
INSERT INTO public.newsletter_subscribers (email, name, role, segments, status, locale)
VALUES 
  ('teacher1@example.com', 'Alice Johnson', 'Teacher', ARRAY['weekly-tips', 'resources'], 'subscribed', 'en'),
  ('admin@school.edu', 'Bob Smith', 'Admin', ARRAY['monthly-updates', 'events'], 'subscribed', 'en'),
  ('parent@example.com', 'Carol White', 'Parent', ARRAY['parent-newsletter'], 'subscribed', 'en');

-- Sample builder lesson plans
INSERT INTO public.builder_lesson_plans (title, anon_user_id, data)
VALUES 
  ('Introduction to Photosynthesis', 'anon-user-123', 
   '{"objective": "Students will understand the process of photosynthesis", "steps": [], "resources": []}'),
  
  ('Creative Writing: Character Development', 'anon-user-456',
   '{"objective": "Students will create compelling characters for their stories", "steps": [], "resources": []}'),
  
  ('Math Problem Solving Strategies', 'anon-user-789',
   '{"objective": "Students will learn various problem-solving techniques", "steps": [], "resources": []}');

-- Sample comments on content
INSERT INTO public.comments (content, content_id, user_id)
SELECT 
  'Great article! This really helped me understand the concept better.',
  id,
  null
FROM public.content_master 
WHERE slug = 'future-ai-education'
LIMIT 1;

INSERT INTO public.comments (content, content_id, user_id)
SELECT 
  'Looking forward to attending this event!',
  id,
  null
FROM public.content_master 
WHERE slug = 'stem-summit-2025'
LIMIT 1;