-- Drop the existing tutorials table if it exists (since we're redesigning it)
DROP TABLE IF EXISTS public.tutorial_tags CASCADE;
DROP TABLE IF EXISTS public.tutorials CASCADE;

-- Create tutorials table with YouTube video embedding support
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  video_url TEXT NOT NULL, -- YouTube video URL or embed code
  video_id TEXT, -- YouTube video ID for easier embedding
  thumbnail_url TEXT, -- Video thumbnail URL
  duration TEXT, -- Video duration (e.g., "10:30")
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT, -- Tutorial category
  tags TEXT[], -- Array of tags
  author_name TEXT,
  author_avatar TEXT,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prerequisites TEXT[], -- Array of prerequisites
  learning_outcomes TEXT[], -- What students will learn
  resources JSONB, -- Additional resources (PDFs, links, etc.)
  transcript TEXT, -- Video transcript for accessibility
  language TEXT DEFAULT 'en' CHECK (language = 'en')
);

-- Enable Row Level Security
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies for tutorials
CREATE POLICY "Published tutorials are viewable by everyone" 
ON public.tutorials 
FOR SELECT 
USING (is_published = true);

-- Create indexes for better performance
CREATE INDEX idx_tutorials_slug ON public.tutorials(slug);
CREATE INDEX idx_tutorials_published ON public.tutorials(is_published, published_at DESC);
CREATE INDEX idx_tutorials_featured ON public.tutorials(is_featured, is_published);
CREATE INDEX idx_tutorials_category ON public.tutorials(category);
CREATE INDEX idx_tutorials_tags ON public.tutorials USING GIN(tags);
CREATE INDEX idx_tutorials_language ON public.tutorials(language);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create use_cases table (similar to blog posts but for specific use cases)
CREATE TABLE public.use_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  grade_level TEXT[], -- Array of grade levels (e.g., ['K-2', '3-5', '6-8'])
  subject_areas TEXT[], -- Array of subjects
  implementation_time TEXT, -- How long to implement
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'complex')),
  required_tools TEXT[], -- Tools/software needed
  student_count TEXT, -- Number of students (e.g., "20-30")
  success_metrics TEXT, -- How to measure success
  featured_image_url TEXT,
  gallery_images TEXT[], -- Array of image URLs
  video_url TEXT, -- Optional video demonstration
  testimonial TEXT, -- Teacher testimonial
  testimonial_author TEXT,
  testimonial_school TEXT,
  results TEXT, -- Measured results/outcomes
  tips TEXT[], -- Implementation tips
  variations TEXT[], -- Different ways to adapt
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for use_cases
CREATE POLICY "Published use cases are viewable by everyone" 
ON public.use_cases 
FOR SELECT 
USING (is_published = true);

-- Create indexes for use_cases
CREATE INDEX idx_use_cases_slug ON public.use_cases(slug);
CREATE INDEX idx_use_cases_published ON public.use_cases(is_published, published_at DESC);
CREATE INDEX idx_use_cases_featured ON public.use_cases(is_featured, is_published);
CREATE INDEX idx_use_cases_category ON public.use_cases(category);
CREATE INDEX idx_use_cases_grade_level ON public.use_cases USING GIN(grade_level);
CREATE INDEX idx_use_cases_subject_areas ON public.use_cases USING GIN(subject_areas);
CREATE INDEX idx_use_cases_tags ON public.use_cases USING GIN(tags);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_use_cases_updated_at
BEFORE UPDATE ON public.use_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();