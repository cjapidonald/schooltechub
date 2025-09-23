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
   ARRAY['Books', 'Discussion cards']),

  ('coding-basics', 'Introduction to Coding', 'Learn basic programming concepts through visual coding', 60,
   'Use block-based coding to create simple programs and games',
   ARRAY['ICT'], ARRAY['Secondary'], ARRAY['coding', 'technology', 'problem-solving'],
   ARRAY['Understand programming logic', 'Develop computational thinking'],
   ARRAY['Computers', 'Scratch or similar platform']);

-- Sample data for classes table (using correct column names)
INSERT INTO public.classes (title, description, instructor_name, category, level, status, start_date, end_date, meeting_schedule, max_capacity, duration_hours, image_url)
VALUES 
  ('Advanced Mathematics', 'Explore algebra, geometry, and calculus concepts', 'Dr. Sarah Johnson', 'Math', 'Secondary', 'active', 
   '2025-01-15', '2025-05-30', 'Mon/Wed/Fri 10:00 AM', 25, 2, null),
  
  ('Creative Writing Workshop', 'Develop your storytelling and writing skills', 'Prof. Michael Chen', 'Language Arts', 'High School', 'upcoming',
   '2025-02-01', '2025-04-15', 'Tue/Thu 2:00 PM', 20, 1, null),
  
  ('Introduction to Biology', 'Basic concepts in life sciences', 'Ms. Emily Davis', 'Science', 'Secondary', 'active',
   '2025-01-10', '2025-06-15', 'Mon/Wed 1:00 PM', 30, 2, null),

  ('Digital Art & Design', 'Learn digital illustration and graphic design fundamentals', 'Alex Martinez', 'Arts', 'High School', 'upcoming',
   '2025-02-15', '2025-05-20', 'Wed/Fri 3:00 PM', 15, 2, null);

-- Sample data for resources table
INSERT INTO public.resources (title, description, type, subject, stage, resource_type, grade_level, format, tags, status, is_active)
VALUES 
  ('Fraction Worksheets Pack', 'Comprehensive worksheets for teaching fractions', 'document', 'Math', 'Primary', 'Worksheets', 'Grade 3-5', 'PDF',
   ARRAY['fractions', 'practice', 'printable'], 'approved', true),
  
  ('Solar System Presentation', 'Interactive slides about planets and space', 'presentation', 'Science', 'Secondary', 'Slides', 'Grade 6-8', 'PowerPoint',
   ARRAY['space', 'planets', 'astronomy'], 'approved', true),
  
  ('Grammar Rules Poster Set', 'Visual aids for common grammar rules', 'image', 'English', 'Primary', 'Posters', 'Grade 2-4', 'PDF',
   ARRAY['grammar', 'visual-aids', 'classroom-decor'], 'approved', true),
  
  ('Chemistry Lab Safety Video', 'Essential safety procedures for lab work', 'video', 'Chemistry', 'High School', 'Videos', 'Grade 9-12', 'MP4',
   ARRAY['safety', 'lab', 'chemistry'], 'approved', true),

  ('History Timeline Interactive', 'Interactive timeline of major historical events', 'document', 'History', 'Secondary', 'Interactive Activities', 'Grade 7-9', 'HTML',
   ARRAY['history', 'timeline', 'interactive'], 'approved', true);

-- Sample data for content_master table (blog posts, events, etc.)
INSERT INTO public.content_master (
  content_type, page, title, slug, excerpt, content, 
  is_published, published_at, tags, stage, 
  author, featured_image, read_time, view_count
)
VALUES 
  ('blog', 'research_blog', 'The Future of AI in Education', 'future-ai-education',
   'Exploring how artificial intelligence is transforming the classroom experience',
   '{"blocks": [{"type": "paragraph", "text": "AI is revolutionizing education through personalized learning paths, intelligent tutoring systems, and automated assessment tools. In this article, we explore the latest developments and their impact on teaching and learning."}]}',
   true, NOW() - INTERVAL '3 days', ARRAY['AI', 'EdTech', 'Innovation'], 
   'K-12', '{"name": "Dr. Rachel Smith", "title": "Education Researcher"}',
   null, 8, 245),
  
  ('event', 'events', 'STEM Education Summit 2025', 'stem-summit-2025',
   'Join educators worldwide for the biggest STEM education conference',
   '{"blocks": [{"type": "paragraph", "text": "Three days of workshops, keynotes, and networking opportunities for STEM educators. Learn from leading experts and discover innovative teaching strategies."}]}',
   true, NOW() - INTERVAL '1 week', ARRAY['STEM', 'Conference', 'Professional Development'],
   'K-12', '{"name": "Education Council", "title": "Event Organizer"}',
   null, 5, 892),
  
  ('teaching_technique', 'research_blog', 'Gamification in the Classroom', 'gamification-classroom',
   'How to use game elements to boost student engagement and motivation',
   '{"blocks": [{"type": "paragraph", "text": "Gamification introduces game-like elements into learning activities. This approach has been shown to increase engagement, motivation, and retention of information."}]}',
   true, NOW() - INTERVAL '10 days', ARRAY['Gamification', 'Engagement', 'Teaching Tips'],
   'Primary', '{"name": "Tom Wilson", "title": "Master Teacher"}',
   null, 12, 567),

  ('case_study', 'research_blog', 'Flipped Classroom Success Story', 'flipped-classroom-success',
   'How one school transformed learning outcomes with the flipped classroom model',
   '{"blocks": [{"type": "paragraph", "text": "Lincoln Middle School saw a 40% improvement in test scores after implementing a flipped classroom approach. This case study examines their journey and key success factors."}]}',
   true, NOW() - INTERVAL '5 days', ARRAY['Case Study', 'Flipped Classroom', 'Success Stories'],
   'Secondary', '{"name": "Jennifer Lee", "title": "Education Consultant"}',
   null, 15, 1203);

-- Update event-specific fields for the STEM Summit
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
  registration_url = 'https://example.com/register',
  event_price_type = 'Paid',
  price = 299.00
WHERE slug = 'stem-summit-2025';

-- Sample FAQ data
INSERT INTO public.faq (question, answer, page, tags, display_order, is_published)
VALUES 
  ('How do I create my first lesson plan?', 
   'Click on the Builder tab in the navigation menu, then follow the step-by-step guide to add activities, resources, and learning objectives. You can save your progress and come back anytime.',
   null, ARRAY['getting-started', 'lesson-planning'], 1, true),
  
  ('Can I share resources with other teachers?',
   'Yes! You can upload resources to our community library where other educators can discover and use them. Just click on Resources and then Upload to share your materials.',
   null, ARRAY['resources', 'sharing', 'community'], 2, true),
  
  ('What file formats are supported for uploads?',
   'We support PDF, Word documents, PowerPoint presentations, images (JPG, PNG), and video files (MP4, MOV) up to 100MB. Contact support if you need to upload larger files.',
   null, ARRAY['uploads', 'technical', 'file-formats'], 3, true),

  ('Is my data secure and private?',
   'Yes, we take data security seriously. All data is encrypted, we use secure connections, and follow educational data privacy standards. Your content remains yours.',
   null, ARRAY['security', 'privacy', 'data'], 4, true);

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
   5, true, true, null),

  ('Michael Chen', 'English Teacher', 'Westfield Academy',
   'The lesson builder is intuitive and the activity suggestions are fantastic. It has made planning much more efficient.',
   5, true, false, null);

-- Sample newsletter subscribers (using is_active column)
INSERT INTO public.newsletter_subscribers (email, name, role, segments, status, locale)
VALUES 
  ('teacher1@example.com', 'Alice Johnson', 'Teacher', ARRAY['weekly-tips', 'resources'], 'subscribed', 'en'),
  ('admin@school.edu', 'Bob Smith', 'Admin', ARRAY['monthly-updates', 'events'], 'subscribed', 'en'),
  ('parent@example.com', 'Carol White', 'Parent', ARRAY['parent-newsletter'], 'subscribed', 'en'),
  ('educator@university.edu', 'Dr. David Brown', 'Teacher', ARRAY['research', 'best-practices'], 'subscribed', 'en');

-- Sample builder lesson plans with more detailed data
INSERT INTO public.builder_lesson_plans (title, anon_user_id, data)
VALUES 
  ('Introduction to Photosynthesis', 'anon-user-123', 
   '{"objective": "Students will understand the process of photosynthesis", "subject": "Biology", "stage": "Secondary", "duration": 45, "materials": ["Plants", "Microscope", "Slides"], "steps": [{"id": "1", "title": "Introduction", "duration": 10, "description": "Explain the concept of photosynthesis"}, {"id": "2", "title": "Demonstration", "duration": 20, "description": "Show plants under microscope"}, {"id": "3", "title": "Discussion", "duration": 15, "description": "Discuss observations"}], "resources": []}'),
  
  ('Creative Writing: Character Development', 'anon-user-456',
   '{"objective": "Students will create compelling characters for their stories", "subject": "English", "stage": "High School", "duration": 60, "materials": ["Character sheets", "Writing prompts"], "steps": [{"id": "1", "title": "Character Basics", "duration": 15, "description": "Name, age, appearance"}, {"id": "2", "title": "Personality Traits", "duration": 20, "description": "Develop character personality"}, {"id": "3", "title": "Backstory", "duration": 25, "description": "Create character history"}], "resources": []}'),
  
  ('Math Problem Solving Strategies', 'anon-user-789',
   '{"objective": "Students will learn various problem-solving techniques", "subject": "Math", "stage": "Secondary", "duration": 50, "materials": ["Problem sets", "Calculator"], "steps": [{"id": "1", "title": "Strategy Introduction", "duration": 15, "description": "Explain different approaches"}, {"id": "2", "title": "Practice Problems", "duration": 25, "description": "Work through examples"}, {"id": "3", "title": "Review", "duration": 10, "description": "Discuss solutions"}], "resources": []}');