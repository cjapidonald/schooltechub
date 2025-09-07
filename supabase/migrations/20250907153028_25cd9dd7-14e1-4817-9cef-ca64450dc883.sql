-- Add more sample bookings
INSERT INTO bookings (booking_type, customer_name, customer_email, customer_phone, school_name, preferred_date, preferred_time, topic, additional_notes, total_amount, status)
VALUES 
  ('whole_school', 'Sarah Johnson', 'sarah.j@lincolnschool.edu', '+1-555-0123', 'Lincoln Elementary', '2025-09-25', '14:00', 'Implementing Google Classroom', 'Need help with initial setup for 30 teachers', 60, 'pending'),
  ('consultation', 'Michael Chen', 'mchen@riverside.edu', '+1-555-0124', 'Riverside High', '2025-09-28', '10:00', 'AI Tools for STEM', 'Looking for tools to enhance physics labs', 30, 'confirmed'),
  ('whole_school', 'Emily Davis', 'edavis@oakwood.edu', '+1-555-0125', 'Oakwood Middle School', '2025-10-02', '09:00', 'Gamification Strategy', 'Want to increase student engagement in math', 60, 'pending');

-- Add more newsletter subscribers with names
INSERT INTO newsletter_subscribers (email, name, is_active)
VALUES 
  ('principal.martinez@westside.edu', 'Dr. Maria Martinez', true),
  ('john.teacher@easthigh.edu', 'John Smith', true),
  ('tech.coordinator@northschool.edu', 'Lisa Wang', true),
  ('sarah.educator@southelem.edu', 'Sarah Thompson', true);

-- Add more case studies with testimonials
INSERT INTO case_studies (title, slug, school_name, challenge, solution, results, is_published)
VALUES 
  ('Westside Elementary: Digital Transformation Success', 'westside-digital-transformation', 'Westside Elementary',
   'Outdated teaching methods, low student engagement, no digital resources',
   'Implemented 1:1 device program with comprehensive teacher training and parent involvement',
   '92% increase in student engagement, 45% improvement in standardized test scores', true),
  ('North High: Creating Future-Ready Students', 'north-high-future-ready', 'North High School',
   'Students unprepared for digital workplace, limited computer science offerings',
   'Launched coding bootcamps, digital literacy curriculum, and industry partnerships',
   'College enrollment in STEM fields up 78%, 95% of graduates report feeling tech-confident', true);

-- Add more testimonials
INSERT INTO testimonials (quote, author_name, author_role, school_name, is_published)
VALUES 
  ('SchoolTech Hub transformed our entire approach to education. The results speak for themselves.', 'Dr. Maria Martinez', 'Principal', 'Westside Elementary', true),
  ('Our students are now excited about learning. The gamification strategies really work!', 'Emily Davis', 'Math Department Head', 'Oakwood Middle School', true),
  ('The best investment we made was in proper tech training. SchoolTech Hub delivered beyond expectations.', 'Michael Chen', 'Technology Director', 'Riverside High', true);

-- Add more tutorials
INSERT INTO tutorials (title, slug, description, video_url, difficulty_level, duration, category, is_published)
VALUES 
  ('Gamification Basics for Beginners', 'gamification-basics', 
   'Learn how to add game elements to your classroom', 
   'https://youtube.com/watch?v=example3', 'beginner', '20 min', 'Engagement', true),
  ('Advanced Google Forms for Assessment', 'advanced-google-forms',
   'Create self-grading quizzes and collect data effectively',
   'https://youtube.com/watch?v=example4', 'advanced', '30 min', 'Assessment', true),
  ('Setting Up Virtual Classroom Rules', 'virtual-classroom-rules',
   'Establish effective online learning environments',
   'https://youtube.com/watch?v=example5', 'intermediate', '22 min', 'Management', true);

-- Add more blog posts
INSERT INTO blog_posts (title, slug, teaser, content, grade_band, primary_keyword, is_published, published_at)
VALUES 
  ('10 Free Tools Every Teacher Should Know', '10-free-tools-teachers',
   'Discover the best free educational technology tools that actually work in the classroom.',
   'Full article content about free tools...', 'All Grades', 'free educational tools', true, NOW()),
  ('Managing Screen Time in Elementary School', 'managing-screen-time-elementary',
   'Practical strategies for balancing technology use with traditional learning methods.',
   'Article about screen time management...', 'K-5', 'screen time management', true, NOW()),
  ('Building Digital Citizenship in Middle School', 'digital-citizenship-middle-school',
   'Teaching responsible online behavior and critical thinking skills.',
   'Article about digital citizenship...', '6-8', 'digital citizenship', true, NOW());

-- Verify all the data
SELECT 'Data Summary:' as info;
SELECT 'bookings' as table_name, COUNT(*) as total_count FROM bookings
UNION ALL
SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers
UNION ALL
SELECT 'case_studies', COUNT(*) FROM case_studies
UNION ALL
SELECT 'tutorials', COUNT(*) FROM tutorials
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials
ORDER BY table_name;