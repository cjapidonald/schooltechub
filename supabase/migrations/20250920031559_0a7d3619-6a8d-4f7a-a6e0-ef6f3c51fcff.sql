-- Add author image and job title columns to content_master
ALTER TABLE public.content_master 
ADD COLUMN IF NOT EXISTS author_image TEXT,
ADD COLUMN IF NOT EXISTS author_job_title TEXT;

-- Update the author column to include structured data
COMMENT ON COLUMN public.content_master.author_image IS 'URL or path to author profile image';
COMMENT ON COLUMN public.content_master.author_job_title IS 'Author job title or position';