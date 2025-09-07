-- Create a table for general contact form inquiries
CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  source_page TEXT, -- Track which page the inquiry came from
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy for public form submissions
CREATE POLICY "Anyone can submit a contact inquiry" 
ON public.contact_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent public SELECT access (protect user data)
CREATE POLICY "Contact inquiries are not publicly viewable" 
ON public.contact_inquiries 
FOR SELECT 
USING (false); -- Will update when auth is implemented

-- Prevent UPDATE and DELETE from public
CREATE POLICY "No public updates to contact inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
USING (false);

CREATE POLICY "No public deletion of contact inquiries" 
ON public.contact_inquiries 
FOR DELETE 
USING (false);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_contact_inquiries_updated_at
BEFORE UPDATE ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create an index on email for faster lookups
CREATE INDEX idx_contact_inquiries_email ON public.contact_inquiries(email);

-- Create an index on status for filtering
CREATE INDEX idx_contact_inquiries_status ON public.contact_inquiries(status);