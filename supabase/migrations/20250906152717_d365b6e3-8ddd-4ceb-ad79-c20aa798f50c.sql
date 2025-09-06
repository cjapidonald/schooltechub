-- Create enum types for various categories
CREATE TYPE public.school_stage AS ENUM ('Pre-K', 'K-2', '3-5', '6-8', '9-12');
CREATE TYPE public.subject AS ENUM ('Phonics', 'Math', 'Science', 'CS/ICT', 'Social Studies', 'Arts', 'Music', 'PE/Health', 'SEL', 'Languages');
CREATE TYPE public.cost_type AS ENUM ('Free', 'Paid');
CREATE TYPE public.group_size AS ENUM ('Solo', 'Pairs', 'Small Group', 'Whole Class');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.booking_type AS ENUM ('consultation', 'mini_audit', 'workshop');

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  teaser TEXT,
  content TEXT NOT NULL,
  takeaway TEXT,
  meta_title TEXT,
  meta_description TEXT,
  primary_keyword TEXT,
  grade_band TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutorials table
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT NOT NULL,
  difficulty_level TEXT,
  estimated_time TEXT,
  prerequisites TEXT[],
  learning_outcomes TEXT[],
  school_stages school_stage[],
  subjects subject[],
  featured_image_url TEXT,
  video_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tools_activities table
CREATE TABLE public.tools_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  best_for TEXT,
  description TEXT,
  school_stages school_stage[],
  subjects subject[],
  cost cost_type NOT NULL DEFAULT 'Free',
  group_sizes group_size[],
  activity_types TEXT[],
  setup_time TEXT,
  devices TEXT[],
  quick_start_steps JSONB,
  accessibility_notes TEXT,
  lesson_idea TEXT,
  privacy_security_notes TEXT,
  free_tier_limits TEXT,
  offline_option BOOLEAN DEFAULT false,
  classroom_flow TEXT,
  external_link TEXT,
  featured_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_type booking_type NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  school_name TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  duration_hours NUMERIC(3,1),
  topic TEXT,
  devices_available TEXT,
  constraints TEXT,
  additional_notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2),
  payment_status TEXT,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT,
  school_name TEXT,
  quote TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_studies table
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  school_name TEXT,
  challenge TEXT,
  solution TEXT,
  results TEXT,
  testimonial_id UUID REFERENCES public.testimonials(id),
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table for blog posts and tutorials
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction tables for many-to-many relationships
CREATE TABLE public.blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, tag_id)
);

CREATE TABLE public.tutorial_tags (
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (tutorial_id, tag_id)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tools_activities_updated_at
BEFORE UPDATE ON public.tools_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at
BEFORE UPDATE ON public.case_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security for all tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access on published content
CREATE POLICY "Published blog posts are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Published tutorials are viewable by everyone" 
ON public.tutorials 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Published tools and activities are viewable by everyone" 
ON public.tools_activities 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Published testimonials are viewable by everyone" 
ON public.testimonials 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Published case studies are viewable by everyone" 
ON public.case_studies 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Tags are viewable by everyone" 
ON public.tags 
FOR SELECT 
USING (true);

CREATE POLICY "Blog post tags are viewable by everyone" 
ON public.blog_post_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Tutorial tags are viewable by everyone" 
ON public.tutorial_tags 
FOR SELECT 
USING (true);

-- Bookings have restricted access - only viewable by the person who made them (will need auth)
-- For now, we'll make them insert-only for anonymous users
CREATE POLICY "Anyone can create a booking" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_tutorials_slug ON public.tutorials(slug);
CREATE INDEX idx_tutorials_published ON public.tutorials(is_published, published_at DESC);
CREATE INDEX idx_tools_activities_slug ON public.tools_activities(slug);
CREATE INDEX idx_tools_activities_filters ON public.tools_activities USING GIN(school_stages, subjects, group_sizes, activity_types);
CREATE INDEX idx_bookings_status ON public.bookings(status, preferred_date);
CREATE INDEX idx_case_studies_slug ON public.case_studies(slug);