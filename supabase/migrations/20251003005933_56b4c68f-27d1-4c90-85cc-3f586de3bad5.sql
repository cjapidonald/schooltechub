-- Create research_projects table
CREATE TABLE public.research_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create research_participants table
CREATE TABLE public.research_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create research_documents table
CREATE TABLE public.research_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.research_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_projects
CREATE POLICY "Admins can view all projects"
  ON public.research_projects FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage projects"
  ON public.research_projects FOR ALL
  USING (is_admin());

-- RLS Policies for research_participants
CREATE POLICY "Admins can view all participants"
  ON public.research_participants FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage participants"
  ON public.research_participants FOR ALL
  USING (is_admin());

-- RLS Policies for research_documents
CREATE POLICY "Admins can view all documents"
  ON public.research_documents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage documents"
  ON public.research_documents FOR ALL
  USING (is_admin());

-- Create update triggers
CREATE TRIGGER update_research_projects_updated_at
  BEFORE UPDATE ON public.research_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_documents_updated_at
  BEFORE UPDATE ON public.research_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();