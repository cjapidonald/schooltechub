-- Remove additional localized content that is no longer supported.
DELETE FROM public.content_master WHERE language IS NOT NULL AND language <> 'en';
