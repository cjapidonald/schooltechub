-- Create remaining tables for website functionality

-- 2. Bookings Table (for consulting)
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_type TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  school_name TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  topic TEXT,
  additional_notes TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Booking policies (anyone can create a booking)
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- 3. Blog Posts Table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  teaser TEXT,
  content TEXT,
  takeaway TEXT,
  primary_keyword TEXT,
  grade_band TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog policies (public can view published posts)
CREATE POLICY "Public can view published posts" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

-- 4. Tools & Activities Table
CREATE TABLE public.tools_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  school_stages TEXT[],
  subjects TEXT[],
  setup_time TEXT,
  group_size TEXT,
  cost TEXT,
  accessibility TEXT,
  activity_types TEXT[],
  devices TEXT[],
  grade_bands TEXT[],
  best_for TEXT,
  quick_start JSONB,
  website_url TEXT,
  tutorial_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tools_activities ENABLE ROW LEVEL SECURITY;

-- Tools policies (public can view all tools)
CREATE POLICY "Public can view all tools" 
ON public.tools_activities 
FOR SELECT 
USING (true);

-- 5. Tutorials Table
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT,
  estimated_time TEXT,
  school_stages TEXT[],
  learning_outcomes TEXT[],
  video_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Tutorial policies (public can view published tutorials)
CREATE POLICY "Public can view published tutorials" 
ON public.tutorials 
FOR SELECT 
USING (is_published = true);

-- 6. Case Studies Table
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  school_name TEXT NOT NULL,
  challenge TEXT,
  solution TEXT,
  results TEXT[],
  testimonial_id UUID,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

-- Case study policies (public can view published case studies)
CREATE POLICY "Public can view published case studies" 
ON public.case_studies 
FOR SELECT 
USING (is_published = true);

-- 7. Testimonials Table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT,
  school_name TEXT,
  quote TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Testimonial policies (public can view all testimonials)
CREATE POLICY "Public can view testimonials" 
ON public.testimonials 
FOR SELECT 
USING (true);

-- Add foreign key relationship between case studies and testimonials
ALTER TABLE public.case_studies 
ADD CONSTRAINT fk_testimonial 
FOREIGN KEY (testimonial_id) 
REFERENCES public.testimonials(id) 
ON DELETE SET NULL;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tools_activities_updated_at
BEFORE UPDATE ON public.tools_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at
BEFORE UPDATE ON public.case_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_tutorials_published ON public.tutorials(is_published, created_at DESC);
CREATE INDEX idx_case_studies_published ON public.case_studies(is_published, created_at DESC);
CREATE INDEX idx_bookings_status ON public.bookings(status, created_at DESC);