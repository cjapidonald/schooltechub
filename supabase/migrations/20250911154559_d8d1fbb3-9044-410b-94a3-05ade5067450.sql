-- Create enum types for events
CREATE TYPE event_type AS ENUM ('workshop', 'webinar', 'meetup');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'archived');

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  body JSONB,
  event_type event_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  registration_url TEXT,
  recording_url TEXT,
  tags TEXT[],
  stages TEXT[],
  subjects TEXT[],
  language TEXT DEFAULT 'en',
  author JSONB,
  media JSONB[],
  seo JSONB,
  status event_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_tags ON public.events USING GIN(tags);
CREATE INDEX idx_events_stages ON public.events USING GIN(stages);
CREATE INDEX idx_events_subjects ON public.events USING GIN(subjects);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only for published events)
CREATE POLICY "Public can view published events" 
ON public.events 
FOR SELECT 
USING (status = 'published');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_events_updated_at();

-- Insert sample events
INSERT INTO public.events (
  title,
  slug,
  description,
  body,
  event_type,
  start_time,
  end_time,
  location,
  is_online,
  registration_url,
  tags,
  stages,
  subjects,
  author,
  media,
  seo,
  status
) VALUES 
(
  'AI in the Classroom: Getting Started',
  'ai-in-the-classroom-getting-started',
  'Learn practical ways to integrate AI tools into your daily teaching',
  '{"content": "Join us for an interactive webinar on implementing AI tools in education. We will cover ChatGPT, Claude, and other AI assistants for lesson planning, assessment creation, and student engagement.", "agenda": ["Introduction to AI in Education", "Practical AI Tools Demo", "Q&A Session"]}',
  'webinar',
  '2025-03-15 15:00:00+00',
  '2025-03-15 16:30:00+00',
  'Zoom',
  true,
  'https://example.com/register/ai-webinar',
  ARRAY['AI', 'Teaching Strategies', 'EdTech'],
  ARRAY['Middle', 'High School'],
  ARRAY['CS/ICT', 'All Subjects'],
  '{"name": "Donald Cjapi", "bio": "EdTech Specialist & Teacher Trainer"}',
  ARRAY['{"type": "image", "url": "/ai-webinar-banner.png"}'::jsonb],
  '{"meta_title": "AI in Education Webinar | SchoolTech Hub", "meta_description": "Join our free webinar on integrating AI tools in the classroom. Learn practical strategies for using ChatGPT and other AI assistants in education."}',
  'published'
),
(
  'Digital Citizenship Workshop',
  'digital-citizenship-workshop',
  'Hands-on session on teaching online safety and digital responsibility',
  '{"content": "A comprehensive workshop covering digital citizenship, online safety, and responsible technology use. Perfect for educators looking to build a strong digital citizenship curriculum.", "materials": ["Workshop slides", "Activity templates", "Assessment rubrics"]}',
  'workshop',
  '2025-03-22 09:00:00+00',
  '2025-03-22 12:00:00+00',
  'Ho Chi Minh City',
  false,
  'https://example.com/register/digital-citizenship',
  ARRAY['Digital Citizenship', 'Online Safety', 'SEL'],
  ARRAY['Primary', 'Middle'],
  ARRAY['SEL', 'CS/ICT'],
  '{"name": "SchoolTech Hub Team", "bio": "Expert trainers in educational technology"}',
  ARRAY['{"type": "image", "url": "/workshop-banner.png"}'::jsonb],
  '{"meta_title": "Digital Citizenship Workshop for Teachers", "meta_description": "Join our hands-on workshop on teaching digital citizenship and online safety to students."}',
  'published'
),
(
  'Teacher Tech Meetup - Vietnam',
  'teacher-tech-meetup-vietnam',
  'Monthly networking event for tech-savvy educators',
  '{"content": "Connect with fellow educators passionate about technology in education. Share experiences, learn new tools, and build your professional network.", "topics": ["Tool sharing session", "Success stories", "Networking time"]}',
  'meetup',
  '2025-03-28 17:00:00+00',
  '2025-03-28 19:00:00+00',
  'Saigon Innovation Hub',
  false,
  'https://example.com/register/teacher-meetup',
  ARRAY['Networking', 'EdTech', 'Community'],
  ARRAY['All Stages'],
  ARRAY['All Subjects'],
  '{"name": "Community Team", "bio": "SchoolTech Hub Community"}',
  NULL,
  '{"meta_title": "Teacher Tech Meetup Vietnam | March 2025", "meta_description": "Join our monthly teacher meetup to network and share EdTech experiences."}',
  'published'
);