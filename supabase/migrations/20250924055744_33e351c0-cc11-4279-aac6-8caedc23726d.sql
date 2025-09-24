-- Create blogs table with only necessary columns
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB,
  author JSONB,
  author_image TEXT,
  featured_image TEXT,
  tags TEXT[],
  keywords TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  read_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table with only necessary columns
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB,
  featured_image TEXT,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  event_type public.event_type_enum,
  event_mode public.event_mode_enum,
  event_status public.event_status_enum,
  event_price_type public.event_price_type_enum,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  venue TEXT,
  event_host TEXT,
  event_capacity INTEGER,
  event_registered INTEGER DEFAULT 0,
  registration_url TEXT,
  recording_url TEXT,
  event_timezone TEXT DEFAULT 'Asia/Bangkok',
  event_language TEXT DEFAULT 'en',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Migrate blog data from content_master
INSERT INTO public.blogs (
  title, slug, excerpt, content, author, author_image, featured_image,
  tags, keywords, meta_title, meta_description,
  is_published, published_at, view_count, read_time,
  created_at, updated_at
)
SELECT 
  title, slug, excerpt, content, author, author_image, featured_image,
  tags, keywords, meta_title, meta_description,
  is_published, published_at, view_count, read_time,
  created_at, updated_at
FROM public.content_master
WHERE content_type IN ('blog', 'teaching_technique', 'case_study', 'research', 'research_question', 'tutorial', 'diary_entry')
  AND page = 'research_blog';

-- Migrate event data from content_master
INSERT INTO public.events (
  title, slug, excerpt, content, featured_image, tags,
  meta_title, meta_description, event_type, event_mode, event_status,
  event_price_type, price, currency, start_datetime, end_datetime,
  venue, event_host, event_capacity, event_registered,
  registration_url, recording_url, event_timezone, event_language,
  is_published, published_at, view_count, created_at, updated_at
)
SELECT 
  title, slug, excerpt, content, featured_image, tags,
  meta_title, meta_description, event_type, event_mode, event_status,
  event_price_type, price, currency, start_datetime, end_datetime,
  venue, event_host, event_capacity, event_registered,
  registration_url, recording_url, event_timezone, event_language,
  is_published, published_at, view_count, created_at, updated_at
FROM public.content_master
WHERE content_type = 'event'
  AND page = 'events';

-- Create indexes for better performance
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE INDEX idx_blogs_published ON public.blogs(is_published, published_at DESC);
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN(tags);

CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_published ON public.events(is_published, published_at DESC);
CREATE INDEX idx_events_dates ON public.events(start_datetime, end_datetime);
CREATE INDEX idx_events_status ON public.events(event_status);

-- Enable RLS on new tables
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blogs (publicly readable when published)
CREATE POLICY "Public can read published blogs"
  ON public.blogs
  FOR SELECT
  USING (is_published = true);

-- Create RLS policies for events (publicly readable when published)
CREATE POLICY "Public can read published events"
  ON public.events
  FOR SELECT
  USING (is_published = true);

-- Create update triggers for updated_at columns
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate comments to reference the new tables
-- First, add new columns for the separated tables
ALTER TABLE public.comments 
  ADD COLUMN blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Update comments to link to the new blog posts
UPDATE public.comments c
SET blog_id = b.id
FROM public.blogs b
INNER JOIN public.content_master cm ON cm.slug = b.slug
WHERE c.content_id = cm.id
  AND cm.content_type IN ('blog', 'teaching_technique', 'case_study', 'research');

-- Update comments to link to the new events
UPDATE public.comments c
SET event_id = e.id
FROM public.events e
INNER JOIN public.content_master cm ON cm.slug = e.slug
WHERE c.content_id = cm.id
  AND cm.content_type = 'event';

-- Drop the old content_id column and its constraint
ALTER TABLE public.comments DROP COLUMN content_id;

-- Add check constraint to ensure a comment is linked to either a blog or an event, but not both
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_single_reference_check 
  CHECK ((blog_id IS NOT NULL AND event_id IS NULL) OR (blog_id IS NULL AND event_id IS NOT NULL) OR (blog_id IS NULL AND event_id IS NULL));

-- Finally, drop the content_master table
DROP TABLE public.content_master CASCADE;