-- Update columns from text to jsonb for richer content

-- blog_posts table
ALTER TABLE public.blog_posts 
ALTER COLUMN content TYPE jsonb USING 
  CASE 
    WHEN content IS NULL THEN NULL
    ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', content))
  END;

-- faq table
ALTER TABLE public.faq 
ALTER COLUMN answer TYPE jsonb USING 
  CASE 
    WHEN answer IS NULL THEN NULL
    ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', answer))
  END;

-- tools_activities table
ALTER TABLE public.tools_activities 
ALTER COLUMN description TYPE jsonb USING 
  CASE 
    WHEN description IS NULL THEN NULL
    ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', description))
  END;

-- tutorials table
ALTER TABLE public.tutorials 
ALTER COLUMN description TYPE jsonb USING 
  CASE 
    WHEN description IS NULL THEN NULL
    ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', description))
  END;

-- case_studies table - handle solution column
ALTER TABLE public.case_studies 
ALTER COLUMN solution TYPE jsonb USING 
  CASE 
    WHEN solution IS NULL THEN NULL
    ELSE jsonb_build_array(jsonb_build_object('type', 'paragraph', 'text', solution))
  END;

-- case_studies table - handle results column (text[] to jsonb)
ALTER TABLE public.case_studies 
ALTER COLUMN results TYPE jsonb USING 
  CASE 
    WHEN results IS NULL THEN NULL
    ELSE to_jsonb(results)
  END;

-- Sample data to demonstrate the new format
UPDATE public.blog_posts 
SET content = '[
  {"type": "paragraph", "text": "Welcome to this comprehensive guide on educational technology."},
  {"type": "image", "src": "https://images.unsplash.com/photo-1509062522246-3755977927d7", "alt": "Students using tablets in classroom"},
  {"type": "paragraph", "text": "Technology has transformed modern education in countless ways."},
  {"type": "youtube", "videoId": "dQw4w9WgXcQ"},
  {"type": "paragraph", "text": "As you can see from the video above, engagement is key to successful tech integration."}
]'::jsonb
WHERE id = (SELECT id FROM public.blog_posts LIMIT 1);

-- Add a sample FAQ with rich content
INSERT INTO public.faq (question, answer, category, display_order, is_published)
VALUES (
  'How do I integrate multimedia content into my lessons?',
  '[
    {"type": "paragraph", "text": "Integrating multimedia is easier than ever with modern tools. Here are the key steps:"},
    {"type": "paragraph", "text": "1. Start with your learning objectives"},
    {"type": "paragraph", "text": "2. Choose appropriate media types"},
    {"type": "image", "src": "https://images.unsplash.com/photo-1588072432836-e10032774350", "alt": "Digital learning tools"},
    {"type": "paragraph", "text": "3. Test with a small group first"},
    {"type": "youtube", "videoId": "example123"},
    {"type": "paragraph", "text": "Remember to always have a backup plan in case technology fails!"}
  ]'::jsonb,
  'Technology Integration',
  1,
  true
) ON CONFLICT DO NOTHING;