-- Create tables for builder activities feature
CREATE TABLE IF NOT EXISTS public.tools_activities (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subjects TEXT[],
  grade_levels TEXT[],
  tags TEXT[],
  duration_minutes INTEGER,
  materials TEXT[],
  instructions TEXT,
  learning_objectives TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create builder activity recents table
CREATE TABLE IF NOT EXISTS public.builder_activity_recents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_user_id TEXT,
  activity_slug TEXT REFERENCES tools_activities(slug) ON DELETE CASCADE,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, activity_slug),
  UNIQUE(anon_user_id, activity_slug)
);

-- Create builder activity favorites table
CREATE TABLE IF NOT EXISTS public.builder_activity_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_user_id TEXT,
  activity_slug TEXT REFERENCES tools_activities(slug) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, activity_slug),
  UNIQUE(anon_user_id, activity_slug)
);

-- Create builder collections table
CREATE TABLE IF NOT EXISTS public.builder_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create builder collection items table
CREATE TABLE IF NOT EXISTS public.builder_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES builder_collections(id) ON DELETE CASCADE,
  activity_slug TEXT REFERENCES tools_activities(slug) ON DELETE CASCADE,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(collection_id, activity_slug)
);

-- Create builder lesson plans table
CREATE TABLE IF NOT EXISTS public.builder_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_id TEXT NOT NULL,
  title TEXT,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tools_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_activity_recents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_activity_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_lesson_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for tools_activities (public read)
CREATE POLICY "Activities are viewable by everyone"
ON public.tools_activities
FOR SELECT
USING (true);

-- Create policies for builder_activity_recents
CREATE POLICY "Users can view their own recents"
ON public.builder_activity_recents
FOR SELECT
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

CREATE POLICY "Users can manage their own recents"
ON public.builder_activity_recents
FOR ALL
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

-- Create policies for builder_activity_favorites
CREATE POLICY "Users can view their own favorites"
ON public.builder_activity_favorites
FOR SELECT
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

CREATE POLICY "Users can manage their own favorites"
ON public.builder_activity_favorites
FOR ALL
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

-- Create policies for builder_collections
CREATE POLICY "Users can view their own collections"
ON public.builder_collections
FOR SELECT
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

CREATE POLICY "Users can manage their own collections"
ON public.builder_collections
FOR ALL
USING (auth.uid() = user_id OR anon_user_id IS NOT NULL);

-- Create policies for builder_collection_items
CREATE POLICY "Users can view items in their collections"
ON public.builder_collection_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM builder_collections
    WHERE builder_collections.id = collection_id
    AND (builder_collections.user_id = auth.uid() OR builder_collections.anon_user_id IS NOT NULL)
  )
);

CREATE POLICY "Users can manage items in their collections"
ON public.builder_collection_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM builder_collections
    WHERE builder_collections.id = collection_id
    AND (builder_collections.user_id = auth.uid() OR builder_collections.anon_user_id IS NOT NULL)
  )
);

-- Create policies for builder_lesson_plans
CREATE POLICY "Users can view their own lesson plans"
ON public.builder_lesson_plans
FOR SELECT
USING (true);

CREATE POLICY "Users can create lesson plans"
ON public.builder_lesson_plans
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own lesson plans"
ON public.builder_lesson_plans
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own lesson plans"
ON public.builder_lesson_plans
FOR DELETE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_builder_activity_recents_user ON builder_activity_recents(user_id);
CREATE INDEX idx_builder_activity_recents_anon ON builder_activity_recents(anon_user_id);
CREATE INDEX idx_builder_activity_favorites_user ON builder_activity_favorites(user_id);
CREATE INDEX idx_builder_activity_favorites_anon ON builder_activity_favorites(anon_user_id);
CREATE INDEX idx_builder_collections_user ON builder_collections(user_id);
CREATE INDEX idx_builder_collections_anon ON builder_collections(anon_user_id);
CREATE INDEX idx_builder_lesson_plans_anon ON builder_lesson_plans(anon_user_id);