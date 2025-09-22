-- Ensure private storage buckets exist for lesson plan exports and research files
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('lesson-plans', 'lesson-plans', false),
  ('research', 'research', false)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Allow research participants to upload submissions into the shared bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'Research participants upload files'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Research participants upload files"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'research'
        AND auth.role() = 'authenticated'
        AND split_part(name, '/', 2) = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM public.research_participants rp
          WHERE rp.user_id = auth.uid()
            AND rp.project_id = (
              CASE
                WHEN split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                  THEN split_part(name, '/', 1)::uuid
                ELSE NULL
              END
            )
        )
      );
  END IF;
END $$;
