-- Fix the slug for the test post to be URL-friendly
UPDATE blog_posts 
SET slug = 'test-post'
WHERE id = '9de15496-9334-4ea9-9eb6-e2705ebb6c7b';

-- Update any other posts with invalid slugs (containing spaces)
UPDATE blog_posts 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug LIKE '% %';