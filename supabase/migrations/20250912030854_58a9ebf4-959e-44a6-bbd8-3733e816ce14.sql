-- Drop existing tables
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.case_studies CASCADE;
DROP TABLE IF EXISTS public.content CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.faq CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.tools_activities CASCADE;
DROP TABLE IF EXISTS public.tutorials CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.content_status CASCADE;
DROP TYPE IF EXISTS public.event_status CASCADE;
DROP TYPE IF EXISTS public.content_type CASCADE;
DROP TYPE IF EXISTS public.hub_type CASCADE;
DROP TYPE IF EXISTS public.cost_type CASCADE;
DROP TYPE IF EXISTS public.event_type CASCADE;

-- Create new FAQ table
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer JSONB NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create new TESTIMONIALS table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT,
  school_name TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  picture_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create new EDTECH table
CREATE TABLE public.edtech (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content JSONB NOT NULL,
  category TEXT NOT NULL, -- 'tutorial', 'technique', 'activity', 'lesson-plan'
  
  -- Filtering fields
  grade_levels TEXT[], -- ['K-2', '3-5', '6-8', '9-12', 'Pre-K']
  subjects TEXT[], -- ['Math', 'Science', 'Language Arts', 'Social Studies', 'Arts', 'PE', 'Technology']
  group_sizes TEXT[], -- ['individual', 'pairs', 'small-group', 'whole-class']
  duration INTEGER, -- in minutes
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  
  -- Activity specific
  activity_type TEXT[], -- ['video', 'worksheet', 'image', 'app', 'tpr-game', 'simulation', 'interactive', 'presentation']
  materials_needed TEXT[],
  
  -- Tech requirements
  tech_requirements TEXT[],
  tools_used TEXT[],
  
  -- Media and metadata
  featured_image TEXT,
  video_url TEXT,
  attachments JSONB, -- [{type: 'pdf', url: '...', title: '...'}]
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Publishing
  author JSONB, -- {name: '...', avatar: '...', bio: '...'}
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create BLOG table
CREATE TABLE public.blog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL,
  category TEXT NOT NULL, -- 'ideas', 'research', 'research-questions', 'case-studies', 'lesson-planning'
  
  -- Filtering fields
  grade_levels TEXT[],
  subjects TEXT[],
  activity_type TEXT[], -- ['video', 'worksheet', 'image', 'app', 'tpr-game', etc.]
  
  -- Media
  featured_image TEXT,
  video_url TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Publishing
  author JSONB,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Keep the events table as is but recreate it
CREATE TYPE public.event_type AS ENUM ('workshop', 'webinar', 'meetup', 'conference');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'archived', 'cancelled');

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  body JSONB,
  event_type public.event_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  registration_url TEXT,
  recording_url TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  
  -- Categorization
  tags TEXT[],
  stages TEXT[],
  subjects TEXT[],
  
  -- Media and author
  featured_image TEXT,
  author JSONB,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status public.event_status DEFAULT 'draft',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Keep newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_faq_category ON public.faq(category);
CREATE INDEX idx_faq_order ON public.faq(display_order);

CREATE INDEX idx_testimonials_featured ON public.testimonials(is_featured);

CREATE INDEX idx_edtech_slug ON public.edtech(slug);
CREATE INDEX idx_edtech_category ON public.edtech(category);
CREATE INDEX idx_edtech_published ON public.edtech(is_published);
CREATE INDEX idx_edtech_grades ON public.edtech USING GIN(grade_levels);
CREATE INDEX idx_edtech_subjects ON public.edtech USING GIN(subjects);
CREATE INDEX idx_edtech_activity ON public.edtech USING GIN(activity_type);

CREATE INDEX idx_blog_slug ON public.blog(slug);
CREATE INDEX idx_blog_category ON public.blog(category);
CREATE INDEX idx_blog_published ON public.blog(is_published);
CREATE INDEX idx_blog_activity ON public.blog USING GIN(activity_type);

CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start ON public.events(start_time);

-- Enable RLS
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edtech ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read, admin write)
CREATE POLICY "Public can view published FAQs" ON public.faq
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view testimonials" ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY "Public can view published edtech" ON public.edtech
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view published blogs" ON public.blog
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON public.faq
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_edtech_updated_at BEFORE UPDATE ON public.edtech
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_blog_updated_at BEFORE UPDATE ON public.blog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert sample data
INSERT INTO public.faq (question, answer, category, display_order) VALUES
('What is SchoolTech Hub?', '{"blocks":[{"type":"paragraph","content":"SchoolTech Hub is an AI-powered educational technology platform that helps teachers integrate VR, gamification, and data-driven tools into their classrooms."}]}', 'General', 1),
('How do I get started?', '{"blocks":[{"type":"paragraph","content":"Sign up for a free account and explore our Edutech hub for tutorials, techniques, and lesson planning resources tailored to your grade level and subjects."}]}', 'Getting Started', 2),
('Is training provided?', '{"blocks":[{"type":"paragraph","content":"Yes! We offer webinars, workshops, and self-paced tutorials. Check our Events page for upcoming sessions."}]}', 'Training', 3);

INSERT INTO public.testimonials (author_name, author_role, school_name, quote, rating, is_featured) VALUES
('Sarah Johnson', 'Math Teacher', 'Lincoln Middle School', 'SchoolTech Hub transformed my classroom! The AI lesson planning tools save me hours each week.', 5, true),
('Michael Chen', 'Principal', 'Riverside Elementary', 'Our teachers love the VR labs and gamification tools. Student engagement has increased by 40%.', 5, true),
('Emma Williams', 'Science Teacher', 'Central High School', 'The activity filters help me find exactly what I need for my lessons. Game changer!', 5, false);

INSERT INTO public.edtech (title, slug, description, content, category, grade_levels, subjects, activity_type, is_published, published_at) VALUES
('Getting Started with AI Lesson Planning', 'ai-lesson-planning-intro', 'Learn how to use AI tools to create engaging lesson plans in minutes', '{"blocks":[{"type":"heading","content":"Introduction to AI Lesson Planning"},{"type":"paragraph","content":"This tutorial will guide you through using AI to create effective lesson plans."}]}', 'tutorial', ARRAY['6-8', '9-12'], ARRAY['Technology', 'All Subjects'], ARRAY['video', 'interactive'], true, now()),
('Think-Pair-Share Technique', 'think-pair-share', 'Classic collaborative learning technique enhanced with digital tools', '{"blocks":[{"type":"heading","content":"Digital Think-Pair-Share"},{"type":"paragraph","content":"Modernize this classic technique using digital collaboration tools."}]}', 'technique', ARRAY['3-5', '6-8'], ARRAY['All Subjects'], ARRAY['interactive'], true, now()),
('Virtual Field Trip: Ancient Rome', 'vr-ancient-rome', 'Take students on an immersive VR journey through Ancient Rome', '{"blocks":[{"type":"heading","content":"VR Field Trip Guide"},{"type":"paragraph","content":"Step-by-step guide to conducting a virtual field trip to Ancient Rome."}]}', 'activity', ARRAY['6-8', '9-12'], ARRAY['Social Studies', 'History'], ARRAY['app', 'video'], true, now());

INSERT INTO public.blog (title, slug, excerpt, content, category, grade_levels, subjects, activity_type, is_published, published_at) VALUES
('5 Ways AI is Revolutionizing K-12 Education', 'ai-revolutionizing-education', 'Discover how artificial intelligence is transforming classrooms worldwide', '{"blocks":[{"type":"heading","content":"The AI Education Revolution"},{"type":"paragraph","content":"From personalized learning to automated grading, AI is changing education."}]}', 'ideas', ARRAY['K-2', '3-5', '6-8', '9-12'], ARRAY['Technology', 'All Subjects'], ARRAY['video', 'interactive'], true, now()),
('Research: Impact of Gamification on Student Engagement', 'gamification-research', 'Latest research findings on how gamification improves learning outcomes', '{"blocks":[{"type":"heading","content":"Gamification Research Findings"},{"type":"paragraph","content":"Our study shows 40% improvement in engagement with gamified lessons."}]}', 'research', ARRAY['3-5', '6-8'], ARRAY['All Subjects'], ARRAY['app', 'interactive'], true, now()),
('Case Study: Lincoln Middle School''s VR Success', 'lincoln-vr-success', 'How one school increased science scores by 30% using VR labs', '{"blocks":[{"type":"heading","content":"VR Implementation Success Story"},{"type":"paragraph","content":"Lincoln Middle School''s journey to implementing VR in science classes."}]}', 'case-studies', ARRAY['6-8'], ARRAY['Science'], ARRAY['video', 'app'], true, now());

INSERT INTO public.events (title, slug, description, event_type, start_time, end_time, location, is_online, registration_url, status) VALUES
('AI Lesson Planning Workshop', 'ai-lesson-planning-workshop', 'Hands-on workshop to master AI-powered lesson planning tools', 'workshop', '2025-02-01 14:00:00+00', '2025-02-01 16:00:00+00', 'Zoom', true, 'https://example.com/register', 'published'),
('VR in Education Webinar', 'vr-education-webinar', 'Learn how to integrate VR into your curriculum', 'webinar', '2025-02-15 15:00:00+00', '2025-02-15 16:00:00+00', 'Google Meet', true, 'https://example.com/register', 'published'),
('EdTech Teachers Meetup', 'edtech-meetup-feb', 'Monthly meetup for teachers using educational technology', 'meetup', '2025-02-20 17:00:00+00', '2025-02-20 19:00:00+00', 'Community Center, Tirana', false, 'https://example.com/register', 'published');