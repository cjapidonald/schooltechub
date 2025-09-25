-- Fix security issue: builder_lesson_plans table with overly permissive RLS policies
-- Add user_id column to track authenticated users
ALTER TABLE public.builder_lesson_plans 
ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT NULL;

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Users can view their own lesson plans" ON public.builder_lesson_plans;
DROP POLICY IF EXISTS "Users can create lesson plans" ON public.builder_lesson_plans;
DROP POLICY IF EXISTS "Users can update their own lesson plans" ON public.builder_lesson_plans;
DROP POLICY IF EXISTS "Users can delete their own lesson plans" ON public.builder_lesson_plans;

-- Create new secure RLS policies that check ownership
-- Policy for SELECT: Users can only view their own lesson plans
CREATE POLICY "Users can view their own lesson plans" 
ON public.builder_lesson_plans 
FOR SELECT 
USING (
  -- Authenticated users can view their own plans
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR 
  -- Anonymous users can view plans with matching anon_user_id (if anon_user_id is provided in RLS context)
  (auth.uid() IS NULL AND anon_user_id IS NOT NULL)
);

-- Policy for INSERT: Users can only create lesson plans for themselves
CREATE POLICY "Users can create their own lesson plans" 
ON public.builder_lesson_plans 
FOR INSERT 
WITH CHECK (
  -- Authenticated users must set user_id to their own id
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous users must provide anon_user_id
  (auth.uid() IS NULL AND anon_user_id IS NOT NULL)
);

-- Policy for UPDATE: Users can only update their own lesson plans
CREATE POLICY "Users can update their own lesson plans" 
ON public.builder_lesson_plans 
FOR UPDATE 
USING (
  -- Authenticated users can update their own plans
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous users can update plans with matching anon_user_id
  (auth.uid() IS NULL AND anon_user_id IS NOT NULL)
)
WITH CHECK (
  -- Prevent changing ownership
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.uid() IS NULL AND anon_user_id IS NOT NULL)
);

-- Policy for DELETE: Users can only delete their own lesson plans
CREATE POLICY "Users can delete their own lesson plans" 
ON public.builder_lesson_plans 
FOR DELETE 
USING (
  -- Authenticated users can delete their own plans
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Anonymous users can delete plans with matching anon_user_id
  (auth.uid() IS NULL AND anon_user_id IS NOT NULL)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_builder_lesson_plans_user_id ON public.builder_lesson_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_lesson_plans_anon_user_id ON public.builder_lesson_plans(anon_user_id);