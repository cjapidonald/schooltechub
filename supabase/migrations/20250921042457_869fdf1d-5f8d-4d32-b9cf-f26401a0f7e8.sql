-- Create an enum for class status
CREATE TYPE public.class_status AS ENUM ('active', 'completed', 'upcoming', 'archived');

-- Create an enum for enrollment status
CREATE TYPE public.enrollment_status AS ENUM ('enrolled', 'completed', 'dropped', 'pending');

-- Create a table for classes/courses
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  instructor_id UUID,
  start_date DATE,
  end_date DATE,
  status class_status DEFAULT 'upcoming',
  max_capacity INTEGER DEFAULT 30,
  current_enrollment INTEGER DEFAULT 0,
  category TEXT,
  level TEXT,
  duration_hours INTEGER,
  image_url TEXT,
  meeting_link TEXT,
  meeting_schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a table for user enrollments in classes
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status enrollment_status DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0, -- percentage of completion
  last_accessed TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classes table
CREATE POLICY "Classes are viewable by everyone" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create classes if they are instructors" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own classes" 
ON public.classes 
FOR UPDATE 
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own classes" 
ON public.classes 
FOR DELETE 
USING (auth.uid() = instructor_id);

-- Create RLS policies for enrollments table
CREATE POLICY "Users can view their own enrollments" 
ON public.enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" 
ON public.enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" 
ON public.enrollments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments" 
ON public.enrollments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_classes_updated_at();

CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollments_updated_at();

-- Create function to increment enrollment count when a user enrolls
CREATE OR REPLACE FUNCTION public.update_class_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
    UPDATE public.classes 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
    UPDATE public.classes 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
    UPDATE public.classes 
    SET current_enrollment = GREATEST(0, current_enrollment - 1) 
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
    UPDATE public.classes 
    SET current_enrollment = GREATEST(0, current_enrollment - 1) 
    WHERE id = OLD.class_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to manage enrollment counts
CREATE TRIGGER manage_enrollment_count
AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_class_enrollment_count();

-- Insert some sample classes for testing
INSERT INTO public.classes (title, description, instructor_name, status, category, level, duration_hours, start_date, end_date, meeting_schedule, image_url)
VALUES 
  ('Introduction to Web Development', 'Learn the fundamentals of HTML, CSS, and JavaScript', 'Dr. Smith', 'active', 'Technology', 'Beginner', 40, '2025-02-01', '2025-03-15', 'Mon/Wed/Fri 2-4 PM', '/api/placeholder/400/300'),
  ('Advanced React Development', 'Master React hooks, context, and performance optimization', 'Prof. Johnson', 'upcoming', 'Technology', 'Advanced', 60, '2025-03-01', '2025-05-01', 'Tue/Thu 3-5 PM', '/api/placeholder/400/300'),
  ('Digital Marketing Fundamentals', 'Explore SEO, social media, and content marketing strategies', 'Ms. Davis', 'active', 'Marketing', 'Beginner', 30, '2025-01-15', '2025-02-28', 'Mon/Wed 10-11:30 AM', '/api/placeholder/400/300'),
  ('Data Science with Python', 'Introduction to data analysis, visualization, and machine learning', 'Dr. Chen', 'upcoming', 'Data Science', 'Intermediate', 50, '2025-02-15', '2025-04-15', 'Tue/Thu 6-8 PM', '/api/placeholder/400/300');