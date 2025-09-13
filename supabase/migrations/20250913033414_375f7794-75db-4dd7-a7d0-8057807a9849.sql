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
CREATE INDEX content_master_fts_idx ON content_master USING GIN (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(excerpt,'') || ' ' || array_to_string(tags, ' '))
);

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
INSERT INTO content_master (page, content_type, title, subtitle, slug, category, stage, subject, tags, is_published, published_at, excerpt, content)
VALUES 
('research_blog', 'case_study', 'Implementing AI in Elementary Math Classes', 'A 6-month case study on AI-assisted learning', 'ai-elementary-math-case-study', 'Lesson Planning', 'Lower Primary', 'Math', ARRAY['AI', 'Math', 'Case Study'], true, now(), 'How AI tools transformed math learning in grade 3-4 classrooms', '{"blocks": [{"type": "paragraph", "data": {"text": "This case study examines the implementation of AI-powered math tools..."}}]}'::jsonb),
('edutech', 'tutorial', 'Getting Started with Kahoot for Formative Assessment', 'Step-by-step guide for teachers', 'kahoot-formative-assessment-tutorial', 'Assessment', 'K-12', NULL, ARRAY['Kahoot', 'Assessment', 'Tutorial'], true, now(), 'Learn how to use Kahoot for quick formative assessments', '{"blocks": [{"type": "paragraph", "data": {"text": "Kahoot is a powerful tool for formative assessment..."}}]}'::jsonb),
('teacher_diary', 'diary_entry', 'Reflections on Project-Based Learning Implementation', 'What worked and what needs improvement', 'pbl-reflection-week-1', 'Engagement', 'Secondary', 'Science', ARRAY['PBL', 'Reflection', 'Science'], true, now(), 'First week implementing PBL in my science class', '{"blocks": [{"type": "paragraph", "data": {"text": "Week 1 of PBL implementation brought many surprises..."}}]}'::jsonb);

INSERT INTO faq (question, answer, page, display_order)
VALUES 
('What technology do I need to get started?', 'Most of our tools work on any device with internet access. We recommend having at least tablets or laptops for students.', 'about', 1),
('How much does professional development cost?', 'Our whole staff PD sessions are $60/hour. Individual consultations are $30/hour.', 'services', 2),
('Are recordings available for webinars?', 'Yes! All webinars are recorded and available to registered participants for 30 days.', 'events', 3);

INSERT INTO testimonials (name, job_title, organization, content, rating, consent, is_featured)
VALUES 
('Sarah Johnson', 'Math Teacher', 'Lincoln Elementary', 'The AI tools recommended here transformed my classroom. Student engagement increased by 40%!', 5, true, true),
('Michael Chen', 'Principal', 'Riverside High School', 'The school audit helped us identify gaps in our tech integration. Worth every penny!', 5, true, true);

INSERT INTO newsletter_subscribers (email, name, segments)
VALUES 
('teacher@example.com', 'Test Teacher', ARRAY['monthly', 'events']),
('admin@school.edu', 'School Admin', ARRAY['weekly', 'services']);