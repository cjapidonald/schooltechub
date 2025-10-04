-- Clean up multilingual test content so that only English posts remain.
DELETE FROM public.content_master WHERE language IS NOT NULL AND language <> 'en';
