-- Ensure lesson plans include sharing metadata
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS share_access TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD CONSTRAINT lesson_plans_share_access_check
    CHECK (share_access IN ('private', 'link', 'org', 'public'));

-- Plan version history table
CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS plan_versions_plan_id_idx
  ON public.plan_versions (plan_id, created_at DESC);

ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

-- Allow owners to manage versions
DROP POLICY IF EXISTS "Owners manage plan versions" ON public.plan_versions;
CREATE POLICY "Owners manage plan versions"
  ON public.plan_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = plan_versions.plan_id
        AND (lp.owner_id = auth.uid() OR auth.uid() IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = plan_versions.plan_id
        AND (lp.owner_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Allow shared viewers to read version history when permitted
DROP POLICY IF EXISTS "Shared readers view plan versions" ON public.plan_versions;
CREATE POLICY "Shared readers view plan versions"
  ON public.plan_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = plan_versions.plan_id
        AND (
          lp.owner_id = auth.uid()
          OR auth.uid() IS NULL
          OR lp.share_access IN ('link', 'org', 'public')
        )
    )
  );

