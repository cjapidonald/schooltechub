-- Add new enums
CREATE TYPE public.filter_type_enum AS ENUM (
  'Edu Tech',
  'Tutorials', 
  'Teaching Techniques',
  'Class Activity',
  'Teacher Reflection',
  'Tips',
  'Shop',
  'Case Study',
  'Research',
  'Teacher Debates'
);

CREATE TYPE public.platform_enum AS ENUM (
  'Mobile App',
  'Webapp',
  'Smartphone',
  'Smartboard',
  'Mac',
  'Windows'
);

CREATE TYPE public.user_role_enum AS ENUM (
  'Teacher',
  'Admin',
  'Parent',
  'Student',
  'Other'
);

-- Update existing data to map old values to new values for stage
UPDATE public.content_master 
  SET stage = CASE
    WHEN stage = 'Lower Primary' THEN 'Primary'
    WHEN stage = 'Upper Primary' THEN 'Primary'
    ELSE stage
  END
WHERE stage IN ('Lower Primary', 'Upper Primary');

-- Update existing data for delivery_type
UPDATE public.content_master 
  SET delivery_type = CASE
    WHEN delivery_type = 'Hybrid' THEN 'Online'
    WHEN delivery_type = 'Offline' THEN 'In-class'
    ELSE delivery_type
  END
WHERE delivery_type IN ('Hybrid', 'Offline');

-- Update payment values
UPDATE public.content_master 
  SET payment = 'Free'
WHERE payment IS NULL OR payment NOT IN ('Free', 'Paid', 'Education Discount');

-- Update existing enums
ALTER TYPE public.stage_enum RENAME TO stage_enum_old;
CREATE TYPE public.stage_enum AS ENUM (
  'Early Childhood',
  'Pre-K',
  'Kindergarten',
  'Primary',
  'Secondary',
  'High School',
  'K-12',
  'K-5'
);

ALTER TYPE public.subject_enum RENAME TO subject_enum_old;
CREATE TYPE public.subject_enum AS ENUM (
  'Phonics',
  'English',
  'Math',
  'Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Earth Science',
  'History',
  'Geography',
  'Music',
  'Arts',
  'ICT',
  'PE',
  'Global Perspective',
  'Circle Time',
  'Break Time',
  'STEAM'
);

ALTER TYPE public.payment_enum RENAME TO payment_enum_old;
CREATE TYPE public.payment_enum AS ENUM (
  'Free',
  'Paid',
  'Education Discount'
);

ALTER TYPE public.delivery_type_enum RENAME TO delivery_type_enum_old;
CREATE TYPE public.delivery_type_enum AS ENUM (
  'In-class',
  'Online',
  'Live',
  'Homework'
);

-- Add new columns to content_master
ALTER TABLE public.content_master 
  ADD COLUMN IF NOT EXISTS filter_type public.filter_type_enum,
  ADD COLUMN IF NOT EXISTS platform public.platform_enum;

-- Update existing columns with new enum types
ALTER TABLE public.content_master 
  ALTER COLUMN stage TYPE public.stage_enum USING stage::text::public.stage_enum,
  ALTER COLUMN subject TYPE public.subject_enum USING subject::text::public.subject_enum,
  ALTER COLUMN payment TYPE public.payment_enum USING payment::text::public.payment_enum,
  ALTER COLUMN delivery_type TYPE public.delivery_type_enum USING delivery_type::text::public.delivery_type_enum;

-- Drop old enum types and columns
DROP TYPE IF EXISTS public.stage_enum_old CASCADE;
DROP TYPE IF EXISTS public.subject_enum_old CASCADE;
DROP TYPE IF EXISTS public.payment_enum_old CASCADE;
DROP TYPE IF EXISTS public.delivery_type_enum_old CASCADE;

ALTER TABLE public.content_master 
  DROP COLUMN IF EXISTS subcategory,
  DROP COLUMN IF EXISTS instruction_type;

-- Drop activity_type column if exists
ALTER TABLE public.content_master 
  DROP COLUMN IF EXISTS activity_type;

-- Create user profiles table for authentication
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role public.user_role_enum DEFAULT 'Other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content_master(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create policies for comments
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Update newsletter_subscribers table
ALTER TABLE public.newsletter_subscribers 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS job_position TEXT,
  ADD COLUMN IF NOT EXISTS role public.user_role_enum;

-- Drop existing if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON public.comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_master_filter_type ON public.content_master(filter_type);
CREATE INDEX IF NOT EXISTS idx_content_master_platform ON public.content_master(platform);