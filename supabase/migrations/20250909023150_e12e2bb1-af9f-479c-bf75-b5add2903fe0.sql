-- Create FAQ table
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
CREATE POLICY "Public can view published FAQs" 
ON public.faq 
FOR SELECT 
USING (is_published = true);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_faq_updated_at
BEFORE UPDATE ON public.faq
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default FAQs
INSERT INTO public.faq (question, answer, category, display_order) VALUES
('How do I book a consultation?', 'You can book a consultation by filling out our contact form or clicking on any of the service options in our Services page. Select your preferred date and time, and we''ll confirm your booking via email.', 'Booking', 1),
('What technology tools do you recommend for beginners?', 'We recommend starting with tools like Google Classroom, Kahoot, and Padlet. These are user-friendly and don''t require extensive technical knowledge. Check out our Tools & Activities page for more recommendations based on your needs.', 'Tools', 2),
('Do you offer group training sessions?', 'Yes! We offer whole-staff professional development sessions that can be customized to your school''s needs. These can be delivered in-person or online.', 'Services', 3),
('How long does a typical coaching session last?', 'Individual coaching sessions typically last 60 minutes, while whole-staff PD sessions can range from 2 hours to full-day workshops depending on your needs.', 'Services', 4),
('Is there ongoing support after training?', 'Yes, we provide follow-up support via email for 30 days after any training session. Extended support packages are also available.', 'Support', 5);