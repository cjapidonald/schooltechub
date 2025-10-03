-- Create saved_posts table for bookmarking blog posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts"
  ON public.saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create content_master table for managing all content types
CREATE TABLE IF NOT EXISTS public.content_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL, -- 'blog', 'event', etc.
  language TEXT DEFAULT 'en',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, language)
);

ALTER TABLE public.content_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content is viewable by everyone"
  ON public.content_master FOR SELECT
  USING (is_published = true);