-- Add picture and company columns to testimonials table
ALTER TABLE public.testimonials 
ADD COLUMN picture_url TEXT,
ADD COLUMN company TEXT;