-- Remove legacy localized blog content in non-English languages.
DELETE FROM public.content_master WHERE language IS NOT NULL AND language <> 'en';
