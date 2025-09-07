-- Create a table for newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Prevent public SELECT, UPDATE, DELETE access
CREATE POLICY "Newsletter subscribers are not publicly viewable" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (false);

CREATE POLICY "No public updates to newsletter subscribers" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (false);

CREATE POLICY "No public deletion of newsletter subscribers" 
ON public.newsletter_subscribers 
FOR DELETE 
USING (false);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on email for faster lookups
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);

-- Create index on is_active for filtering active subscribers
CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active);