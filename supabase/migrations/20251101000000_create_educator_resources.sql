-- Create enums for resource workflow
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_status_enum') THEN
    CREATE TYPE public.resource_status_enum AS ENUM ('draft', 'published', 'archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_visibility_enum') THEN
    CREATE TYPE public.resource_visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

-- Create educator resources table
CREATE TABLE IF NOT EXISTS public.educator_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  favicon_url TEXT,
  thumbnail_url TEXT,
  resource_type TEXT,
  subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  instructional_notes TEXT,
  status public.resource_status_enum NOT NULL DEFAULT 'draft',
  visibility public.resource_visibility_enum NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS educator_resources_normalized_url_idx
  ON public.educator_resources (normalized_url);

ALTER TABLE public.educator_resources ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'educator_resources_updated_at'
  ) THEN
    CREATE TRIGGER educator_resources_updated_at
      BEFORE UPDATE ON public.educator_resources
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Public read published resources'
      AND tablename = 'educator_resources'
  ) THEN
    CREATE POLICY "Public read published resources"
      ON public.educator_resources
      FOR SELECT
      USING (visibility = 'public' AND status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners read educator resources'
      AND tablename = 'educator_resources'
  ) THEN
    CREATE POLICY "Owners read educator resources"
      ON public.educator_resources
      FOR SELECT
      USING (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners insert educator resources'
      AND tablename = 'educator_resources'
  ) THEN
    CREATE POLICY "Owners insert educator resources"
      ON public.educator_resources
      FOR INSERT
      WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners update educator resources'
      AND tablename = 'educator_resources'
  ) THEN
    CREATE POLICY "Owners update educator resources"
      ON public.educator_resources
      FOR UPDATE
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners delete educator resources'
      AND tablename = 'educator_resources'
  ) THEN
    CREATE POLICY "Owners delete educator resources"
      ON public.educator_resources
      FOR DELETE
      USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Storage bucket for resource assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-assets', 'resource-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Public read resource assets'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read resource assets"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'resource-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated upload resource assets'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated upload resource assets"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'resource-assets' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners update resource assets'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owners update resource assets"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'resource-assets' AND (auth.uid() = owner OR owner IS NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners delete resource assets'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owners delete resource assets"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'resource-assets' AND (auth.uid() = owner OR owner IS NULL));
  END IF;
END $$;
