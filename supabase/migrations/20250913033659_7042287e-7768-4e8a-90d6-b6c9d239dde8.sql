-- ===== CLEANUP OLD TABLES (keeping home-related data intact) =====
DROP TABLE IF EXISTS blog CASCADE;
DROP TABLE IF EXISTS edtech CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;

-- Drop old types
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;

-- ===== CREATE NEW ENUMS =====
CREATE TYPE page_enum AS ENUM ('research_blog','edutech','teacher_diary','events','services','about');
CREATE TYPE content_type_enum AS ENUM ('blog','case_study','research','research_question','teaching_technique','activity','tutorial','diary_entry','event','service','about');
CREATE TYPE category_enum AS ENUM ('Lesson Planning','Engagement','Assessment');
CREATE TYPE subcategory_enum AS ENUM ('Lesson Planning','Lesson Delivery','Engagement','Evaluation');
CREATE TYPE stage_enum AS ENUM ('Early Childhood','Pre-K','Kindergarten','Lower Primary','Upper Primary','Primary','Secondary','High School','K-12','K-5');
CREATE TYPE subject_enum AS ENUM ('Phonics','Reading','Writing','Grammar','Spelling','Vocabulary','English/ELA','Math','Science','Biology','Chemistry','Physics','Earth Science','ICT','STEM','STEAM');
CREATE TYPE activity_type_enum AS ENUM ('1:1','Pairs','Small Group','Whole Class','Stations','Clubs');
CREATE TYPE instruction_type_enum AS ENUM ('Direct Instruction','Differentiated Instruction','Inquiry-Based Learning','Project-Based Learning','Problem-Based Learning','Play-Based Learning','Game-Based Learning','Gamification','Cooperative Learning','Experiential Learning','Design Thinking','Socratic Seminar','Station Rotation','Blended Learning');
CREATE TYPE resource_type_enum AS ENUM ('Worksheets','Printables','Task Cards','Flashcards','Mats','Slides','Presentations','Videos','Animations','Pictures','Posters','Readers','eBooks','Audio','Podcasts','Quizzes','Interactive Activities','Labs','Experiments','Simulations','Coding Challenges','Spreadsheets');
CREATE TYPE delivery_type_enum AS ENUM ('In-class','Online','Hybrid','Self-paced','Distance Learning','Live');
CREATE TYPE payment_enum AS ENUM ('Free','Freemium','Paid','Free Trial','Education Discount');
CREATE TYPE bloom_enum AS ENUM ('Remember','Understand','Apply','Analyze','Evaluate','Create');
CREATE TYPE language_level_enum AS ENUM ('A1','A2','B1','B2','C1','C2');
CREATE TYPE event_type_enum AS ENUM ('Workshop','Webinar','Meetup');
CREATE TYPE event_status_enum AS ENUM ('Upcoming','Before','During','After','Follow-Up');
CREATE TYPE event_mode_enum AS ENUM ('Online','In-person','Hybrid','Live');
CREATE TYPE event_price_type_enum AS ENUM ('Free','Paid');
CREATE TYPE service_model_enum AS ENUM ('1:1','Whole Staff PD','Audit','Custom');
CREATE TYPE billing_enum AS ENUM ('Hourly','Fixed','Retainer');
CREATE TYPE sla_tier_enum AS ENUM ('Basic','Standard','Pro','Enterprise');

-- ===== MASTER CONTENT TABLE =====
CREATE TABLE content_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_published BOOLEAN DEFAULT false,

  page page_enum NOT NULL,
  content_type content_type_enum NOT NULL,

  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  
  content JSONB,
  excerpt TEXT,
  featured_image TEXT,
  
  category category_enum,
  subcategory subcategory_enum,

  stage stage_enum,
  subject subject_enum,
  activity_type activity_type_enum,
  instruction_type instruction_type_enum,
  resource_type resource_type_enum,

  delivery_type delivery_type_enum,
  payment payment_enum,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',

  tags TEXT[],
  audience TEXT,
  age_grade TEXT,
  curriculum_alignment TEXT,
  engagement_features TEXT,

  learning_goals TEXT,
  bloom_level bloom_enum,
  language_level language_level_enum,
  language TEXT DEFAULT 'en',
  translation_of UUID REFERENCES content_master(id) ON DELETE SET NULL,

  file_format TEXT,
  license TEXT,
  login_method TEXT,
  device_os TEXT,
  materials_devices TEXT,

  time_required TEXT,
  prep_level TEXT,
  data_compliance TEXT,
  standards_other TEXT,

  research_type TEXT,
  research_question_tags TEXT,
  case_study_tags TEXT,
  forum_category TEXT,
  idea_tips TEXT,
  diary_type TEXT,
  mood TEXT,

  event_type event_type_enum,
  event_status event_status_enum,
  event_mode event_mode_enum,
  event_timezone TEXT DEFAULT 'Asia/Bangkok',
  event_language TEXT DEFAULT 'en',
  event_host TEXT,
  venue TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  event_duration TEXT,
  event_capacity INT,
  event_registered INT DEFAULT 0,
  event_price_type event_price_type_enum,
  event_certificate_pd BOOLEAN DEFAULT false,
  registration_url TEXT,
  recording_url TEXT,

  service_model service_model_enum,
  billing billing_enum,
  sla_tier sla_tier_enum,
  deliverables TEXT,
  guarantee TEXT,

  testimonials_json JSONB,
  faq_json JSONB,
  newsletter_segment TEXT,

  view_count INT DEFAULT 0,
  read_time INT,
  
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  author JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_content_page_type ON content_master (page, content_type);
CREATE INDEX idx_content_stage_subject ON content_master (stage, subject);
CREATE INDEX idx_content_event ON content_master (event_type, event_status);
CREATE INDEX idx_content_tags ON content_master USING GIN (tags);
CREATE INDEX idx_content_published ON content_master (is_published, published_at DESC);
CREATE INDEX idx_content_slug ON content_master (slug);

-- ===== AUXILIARY TABLES =====
CREATE TABLE faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[],
  page page_enum,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  job_title TEXT,
  organization TEXT,
  email TEXT,
  content TEXT NOT NULL,
  rating INT,
  page page_enum,
  related_content_id UUID REFERENCES content_master(id) ON DELETE SET NULL,
  consent BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  segments TEXT[],
  status TEXT DEFAULT 'subscribed',
  locale TEXT DEFAULT 'en',
  audience TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== RLS POLICIES =====
ALTER TABLE content_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read published content"
ON content_master FOR SELECT
USING (is_published = true);

CREATE POLICY "Public can read published FAQ"
ON faq FOR SELECT
USING (is_published = true);

CREATE POLICY "Public can read testimonials with consent"
ON testimonials FOR SELECT
USING (consent = true);

-- Newsletter subscription
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_master_updated_at
BEFORE UPDATE ON content_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_updated_at
BEFORE UPDATE ON faq
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON testimonials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO content_master (page, content_type, title, subtitle, slug, category, subcategory, stage, subject, tags, is_published, published_at, excerpt, content, meta_title, meta_description, read_time, prep_level, time_required)
VALUES 
('research_blog', 'case_study', 'Implementing AI in Elementary Math Classes', 'A 6-month case study on AI-assisted learning', 'ai-elementary-math-case-study', 'Lesson Planning', NULL, 'Lower Primary', 'Math', ARRAY['AI', 'Math', 'Case Study'], true, now(), 'How AI tools transformed math learning in grade 3-4 classrooms', '{"blocks": [{"type": "paragraph", "data": {"text": "This case study examines the implementation of AI-powered math tools in elementary classrooms over a 6-month period. We tracked student engagement, learning outcomes, and teacher satisfaction."}}]}'::jsonb, 'Case Study: AI in Elementary Math — Key Results', 'What changed, how we did it, and results teachers can replicate.', 8, 'Low Prep', '45 min'),
('research_blog', 'research_question', 'How Does Gamification Impact Student Retention?', 'Exploring the connection between game elements and memory', 'gamification-student-retention', 'Engagement', NULL, 'K-12', NULL, ARRAY['Gamification', 'Research', 'Retention'], true, now(), 'Research into how game mechanics affect student memory and retention', '{"blocks": [{"type": "paragraph", "data": {"text": "This research question explores the relationship between gamification elements and student retention rates across different subjects and age groups."}}]}'::jsonb, 'Research: Gamification Impact on Retention', 'Exploring game elements effect on student memory and learning outcomes.', 5, NULL, '30 min'),
('edutech', 'tutorial', 'Getting Started with Kahoot for Formative Assessment', 'Step-by-step guide for teachers', 'kahoot-formative-assessment-tutorial', 'Assessment', 'Evaluation', 'K-12', NULL, ARRAY['Kahoot', 'Assessment', 'Tutorial'], true, now(), 'Learn how to use Kahoot for quick formative assessments', '{"blocks": [{"type": "paragraph", "data": {"text": "Kahoot is a powerful tool for formative assessment. This tutorial will walk you through setting up your first quiz and analyzing results."}}]}'::jsonb, 'Kahoot Tutorial: Quick Formative Assessment', 'Step-by-step guide to using Kahoot for classroom assessment.', 10, 'Low Prep', '15 min'),
('edutech', 'activity', 'Digital Escape Room for Science Review', 'Engaging end-of-unit review activity', 'digital-escape-room-science', 'Engagement', 'Lesson Delivery', 'Secondary', 'Science', ARRAY['Digital', 'Escape Room', 'Review'], true, now(), 'Create an exciting digital escape room for science review', '{"blocks": [{"type": "paragraph", "data": {"text": "Transform your science review into an engaging digital escape room that students will love. Perfect for end-of-unit assessments."}}]}'::jsonb, 'Digital Escape Room Science Activity', 'Engaging review activity using digital escape room format.', 15, 'Medium Prep', '60 min'),
('teacher_diary', 'diary_entry', 'First Week with Station Rotation', 'Reflections on implementing station rotation model', 'station-rotation-week-1', 'Lesson Planning', 'Lesson Delivery', 'Upper Primary', NULL, ARRAY['Station Rotation', 'Reflection'], true, now(), 'My experience implementing station rotation for the first time', '{"blocks": [{"type": "paragraph", "data": {"text": "Week 1 of station rotation brought many surprises. Students adapted quickly to the format, but I learned several important lessons about timing and transitions."}}]}'::jsonb, 'Teacher Diary: Station Rotation Week 1', 'Real classroom experience implementing station rotation model.', 6, NULL, '20 min'),
('events', 'event', 'AI Tools for Math Teachers Workshop', 'Hands-on workshop exploring AI tools for mathematics education', 'ai-math-workshop-jan-2025', NULL, NULL, 'Secondary', 'Math', ARRAY['Workshop', 'AI', 'Math'], true, now(), 'Learn to integrate AI tools into your math classroom', '{"blocks": [{"type": "paragraph", "data": {"text": "Join us for a hands-on workshop where we explore practical AI tools for mathematics education. Perfect for secondary math teachers."}}]}'::jsonb, 'AI Math Workshop — Jan 2025 | SchoolTech Hub', 'AI tools for math education. Jan 25, 2025, 2PM Bangkok time. Online. Register now.', NULL, NULL, '2 hours'),
('services', 'service', 'Custom School Dashboard Development', 'Tailored dashboard solutions for your school', 'custom-dashboard-service', NULL, NULL, NULL, NULL, ARRAY['Dashboard', 'Custom', 'Analytics'], true, now(), 'Get a custom dashboard built for your schools specific needs', '{"blocks": [{"type": "paragraph", "data": {"text": "We develop custom dashboards that give you real-time insights into student progress, attendance, and engagement metrics."}}]}'::jsonb, 'Custom School Dashboard Service', 'Tailored dashboard development for educational institutions.', NULL, NULL, NULL);

-- Set event-specific data
UPDATE content_master 
SET 
  event_type = 'Workshop',
  event_status = 'Upcoming',
  event_mode = 'Online',
  start_datetime = '2025-01-25 14:00:00+07',
  end_datetime = '2025-01-25 16:00:00+07',
  event_capacity = 50,
  event_price_type = 'Free',
  event_certificate_pd = true,
  registration_url = '/events/register/ai-math-workshop-jan-2025'
WHERE slug = 'ai-math-workshop-jan-2025';

-- Set service-specific data
UPDATE content_master
SET
  service_model = 'Custom',
  billing = 'Fixed',
  price = 100,
  deliverables = 'Custom dashboard with real-time analytics, student progress tracking, attendance monitoring',
  guarantee = '30-day satisfaction guarantee with free revisions'
WHERE slug = 'custom-dashboard-service';

-- Set instruction and activity types
UPDATE content_master SET instruction_type = 'Blended Learning', activity_type = 'Whole Class', delivery_type = 'Hybrid', payment = 'Free' WHERE slug = 'kahoot-formative-assessment-tutorial';
UPDATE content_master SET instruction_type = 'Game-Based Learning', activity_type = 'Small Group', delivery_type = 'In-class' WHERE slug = 'digital-escape-room-science';
UPDATE content_master SET mood = 'optimistic', diary_type = 'reflection' WHERE slug = 'station-rotation-week-1';

INSERT INTO faq (question, answer, page, display_order)
VALUES 
('What technology do I need to get started?', 'Most of our tools work on any device with internet access. We recommend having at least tablets or laptops for students.', 'about', 1),
('How much does professional development cost?', 'Our whole staff PD sessions are $60/hour. Individual consultations are $30/hour.', 'services', 2),
('Are recordings available for webinars?', 'Yes! All webinars are recorded and available to registered participants for 30 days.', 'events', 3),
('Do you offer free trials?', 'Many of our recommended tools offer free trials or freemium versions. Check each tool listing for details.', 'edutech', 4),
('How do I submit a research question?', 'You can submit research questions through our blog submission form or during our monthly research meetups.', 'research_blog', 5);

INSERT INTO testimonials (name, job_title, organization, content, rating, consent, is_featured, page)
VALUES 
('Sarah Johnson', 'Math Teacher', 'Lincoln Elementary', 'The AI tools recommended here transformed my classroom. Student engagement increased by 40%!', 5, true, true, 'about'),
('Michael Chen', 'Principal', 'Riverside High School', 'The school audit helped us identify gaps in our tech integration. Worth every penny!', 5, true, true, 'services'),
('Emma Williams', 'Science Teacher', 'Central Middle School', 'The digital escape room activity was a huge hit with my students. They begged to do it again!', 5, true, false, 'edutech'),
('David Martinez', 'Technology Coordinator', 'District 45', 'The workshops are practical and immediately applicable. Our teachers love them!', 5, true, true, 'events');

INSERT INTO newsletter_subscribers (email, name, segments)
VALUES 
('teacher1@example.com', 'Test Teacher 1', ARRAY['monthly', 'events']),
('teacher2@school.edu', 'Test Teacher 2', ARRAY['weekly', 'research']),
('admin@district.edu', 'District Admin', ARRAY['monthly', 'services']);