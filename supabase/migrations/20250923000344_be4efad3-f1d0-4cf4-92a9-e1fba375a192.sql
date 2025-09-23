-- Create builder link health reports table
CREATE TABLE IF NOT EXISTS public.builder_link_health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  is_healthy BOOLEAN DEFAULT true,
  status_code INTEGER,
  status_text TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create builder resource links table
CREATE TABLE IF NOT EXISTS public.builder_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_healthy BOOLEAN DEFAULT true,
  status_code INTEGER,
  status_text TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.builder_link_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_resource_links ENABLE ROW LEVEL SECURITY;

-- Create policies for link health reports (public read)
CREATE POLICY "Link health reports are viewable by everyone"
ON public.builder_link_health_reports
FOR SELECT
USING (true);

-- Create policies for resource links (public read)
CREATE POLICY "Resource links are viewable by everyone"
ON public.builder_resource_links
FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_builder_link_health_url ON builder_link_health_reports(url);
CREATE INDEX idx_builder_resource_links_url ON builder_resource_links(url);