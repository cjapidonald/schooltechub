-- Create resources table for storing educational resources
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  storage_path TEXT,
  type TEXT DEFAULT 'document',
  subject TEXT,
  stage TEXT,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Account/user-specific resource fields
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT,
  grade_level TEXT,
  format TEXT,
  instructional_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_is_active ON public.resources(is_active);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);
CREATE INDEX idx_resources_creator_id ON public.resources(creator_id);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_subject ON public.resources(subject);
CREATE INDEX idx_resources_stage ON public.resources(stage);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);

-- RLS Policies for public resources catalog
CREATE POLICY "Public can view approved active resources"
ON public.resources
FOR SELECT
USING (status = 'approved' AND is_active = true);

-- RLS Policies for user's own resources
CREATE POLICY "Users can view their own resources"
ON public.resources
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own resources"
ON public.resources
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own resources"
ON public.resources
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own resources"
ON public.resources
FOR DELETE
USING (auth.uid() = creator_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_resources_updated_at();

-- Create admin_roles table for admin panel access control
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);

-- Enable RLS on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Admin roles policies
CREATE POLICY "Only admins can view admin roles"
ON public.admin_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can manage admin roles"
ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
  )
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Check if user exists in admin_roles
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = target_user_id
  );
END;
$$;

-- Additional policies for admin resource management
CREATE POLICY "Admins can view all resources"
ON public.resources
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update resource status"
ON public.resources
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any resource"
ON public.resources
FOR DELETE
USING (is_admin());