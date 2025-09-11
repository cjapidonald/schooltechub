-- Create enums for the unified content table
CREATE TYPE hub_type AS ENUM ('tools', 'learn', 'evidence', 'community', 'services', 'about');
CREATE TYPE content_type_enum AS ENUM (
  'tool', 'template', 'tutorial', 'teaching_technique', 'activity', 
  'lesson_plan', 'teacher_tip', 'blog', 'case_study', 'research', 
  'research_question', 'event', 'course', 'consulting', 'student_project', 'news'
);
CREATE TYPE cost_type AS ENUM ('free', 'freemium', 'paid');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

-- Create the unified content table
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  hub hub_type NOT NULL,
  content_type content_type_enum NOT NULL,
  stages TEXT[],
  subjects TEXT[],
  group_sizes TEXT[],
  cost cost_type DEFAULT 'free',
  duration_minutes INTEGER,
  tags TEXT[],
  language TEXT DEFAULT 'en',
  translations JSONB,
  author JSONB,
  media JSONB[],
  body JSONB,
  seo JSONB,
  status content_status DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  tool_meta JSONB,
  activity_meta JSONB,
  event_meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public viewing of published content
CREATE POLICY "Public can view published content" 
ON public.content 
FOR SELECT 
USING (status = 'published');

-- Create indexes for better performance
CREATE INDEX idx_content_hub ON public.content(hub);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_slug ON public.content(slug);
CREATE INDEX idx_content_status ON public.content(status);
CREATE INDEX idx_content_stages ON public.content USING GIN(stages);
CREATE INDEX idx_content_subjects ON public.content USING GIN(subjects);
CREATE INDEX idx_content_tags ON public.content USING GIN(tags);

-- Create trigger for updated_at
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing tools data
INSERT INTO public.content (
  slug, title, hub, content_type, stages, subjects, group_sizes, 
  cost, tags, body, status, published_at
)
SELECT 
  LOWER(REPLACE(name, ' ', '-')),
  name,
  'tools'::hub_type,
  'tool'::content_type_enum,
  school_stages,
  subjects,
  ARRAY[group_size],
  CASE 
    WHEN cost = 'Free' THEN 'free'::cost_type
    WHEN cost LIKE '%Freemium%' THEN 'freemium'::cost_type
    ELSE 'paid'::cost_type
  END,
  activity_types,
  jsonb_build_object(
    'description', description,
    'quick_start', quick_start,
    'best_for', best_for,
    'setup_time', setup_time,
    'accessibility', accessibility
  ),
  'published'::content_status,
  created_at
FROM public.tools_activities;

-- Migrate existing tutorials data
INSERT INTO public.content (
  slug, title, hub, content_type, stages, duration_minutes,
  body, status, published_at
)
SELECT 
  LOWER(REPLACE(title, ' ', '-')),
  title,
  'learn'::hub_type,
  'tutorial'::content_type_enum,
  school_stages,
  CASE 
    WHEN estimated_time LIKE '%min%' THEN 
      CAST(REGEXP_REPLACE(estimated_time, '[^0-9]', '', 'g') AS INTEGER)
    ELSE 30
  END,
  jsonb_build_object(
    'description', description,
    'learning_outcomes', learning_outcomes,
    'video_url', video_url,
    'difficulty_level', difficulty_level
  ),
  CASE WHEN is_published THEN 'published'::content_status ELSE 'draft'::content_status END,
  created_at
FROM public.tutorials;

-- Migrate existing blog posts
INSERT INTO public.content (
  slug, title, hub, content_type, tags, body, seo, status, published_at
)
SELECT 
  slug,
  title,
  'evidence'::hub_type,
  'blog'::content_type_enum,
  ARRAY[primary_keyword],
  jsonb_build_object(
    'content', content,
    'teaser', teaser,
    'takeaway', takeaway,
    'grade_band', grade_band
  ),
  jsonb_build_object(
    'meta_title', title,
    'meta_description', teaser
  ),
  CASE WHEN is_published THEN 'published'::content_status ELSE 'draft'::content_status END,
  published_at
FROM public.blog_posts;

-- Migrate case studies
INSERT INTO public.content (
  slug, title, hub, content_type, body, status, published_at
)
SELECT 
  LOWER(REPLACE(title, ' ', '-')),
  title,
  'evidence'::hub_type,
  'case_study'::content_type_enum,
  jsonb_build_object(
    'school_name', school_name,
    'challenge', challenge,
    'solution', solution,
    'results', results
  ),
  CASE WHEN is_published THEN 'published'::content_status ELSE 'draft'::content_status END,
  created_at
FROM public.case_studies;