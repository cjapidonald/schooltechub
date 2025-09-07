-- Insert sample newsletter subscriber
INSERT INTO newsletter_subscribers (email, name, is_active)
VALUES 
  ('test@example.com', 'Test User', true),
  ('demo@schooltechhub.com', 'Demo Subscriber', true);

-- Insert sample testimonials
INSERT INTO testimonials (quote, author_name, author_role, school_name, is_published)
VALUES 
  ('The transformation has been incredible. Our teachers went from avoiding technology to actively seeking new tools.', 'Dr. Maria Rodriguez', 'Principal', 'Lincoln Elementary School', true),
  ('We thought we needed expensive equipment. Turns out, we just needed the right strategy.', 'James Chen', 'STEM Coordinator', 'Riverside High School', true);

-- Insert sample case studies
INSERT INTO case_studies (title, slug, school_name, challenge, solution, results, is_published)
VALUES 
  ('Lincoln Elementary: From Tech-Shy to Tech-Savvy', 'lincoln-elementary-transformation', 'Lincoln Elementary School', 
   'Teachers were overwhelmed by new 1:1 Chromebook initiative with minimal training', 
   'Implemented phased training program with peer mentoring and weekly tech tips', 
   '85% of teachers now integrate tech daily, student engagement up 40%', true),
  ('Riverside High: Revolutionizing STEM with Simple Tools', 'riverside-high-stem', 'Riverside High School',
   'Limited budget for STEM resources, outdated computer lab',
   'Leveraged free tools like Google Colab and Tinkercad for virtual labs',
   'STEM enrollment increased 60%, AP Computer Science pass rate up 35%', true);

-- Insert sample tutorials (using correct columns)
INSERT INTO tutorials (title, slug, description, video_url, difficulty_level, duration, is_published)
VALUES 
  ('Getting Started with Google Classroom', 'google-classroom-basics', 
   'Master the fundamentals of Google Classroom in 15 minutes', 
   'https://youtube.com/watch?v=example1', 'Beginner', '15 min', true),
  ('AI-Powered Lesson Planning', 'ai-lesson-planning',
   'Use ChatGPT and other AI tools to create differentiated lessons',
   'https://youtube.com/watch?v=example2', 'Intermediate', '25 min', true);

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, teaser, content, is_published, published_at)
VALUES 
  ('5 Quick Wins with AI for Busy Teachers', '5-quick-wins-ai-teachers',
   'Transform your daily teaching routine with these simple AI tools that take less than 5 minutes to implement.',
   'Full article content here...', true, NOW()),
  ('TPR + Tablets: Movement Meets Media', 'tpr-tablets-movement-media',
   'Combine Total Physical Response with digital tools to create dynamic, engaging lessons.',
   'Full article content here...', true, NOW());

-- Insert sample tools/activities
INSERT INTO tools_activities (name, slug, description, cost, is_published)
VALUES 
  ('Kahoot', 'kahoot', 'Interactive quiz platform for engaging assessments', 'Free', true),
  ('Padlet', 'padlet', 'Digital bulletin board for collaboration', 'Free', true);

-- Verify the data was inserted
SELECT 'newsletter_subscribers' as table_name, COUNT(*) as row_count FROM newsletter_subscribers
UNION ALL
SELECT 'case_studies', COUNT(*) FROM case_studies
UNION ALL
SELECT 'tutorials', COUNT(*) FROM tutorials
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'tools_activities', COUNT(*) FROM tools_activities
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials;