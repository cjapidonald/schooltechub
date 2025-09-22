-- Ensure required extensions are available
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- Replace any previous implementation of the shared resources catalog
drop table if exists public.resources cascade;

-- Core resources table used by the lesson builder and public resources page
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  url text not null,
  type text not null check (type in ('worksheet','video','picture','ppt','online','offline')),
  subject text,
  stage text,
  tags text[] not null default '{}'::text[],
  thumbnail_url text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Indexes to support search and filtering
create index if not exists idx_resources_title_trgm
  on public.resources using gin (title gin_trgm_ops);

create index if not exists idx_resources_tags_gin
  on public.resources using gin (tags);

create index if not exists idx_resources_type_subject_stage
  on public.resources (type, subject, stage);

-- Enable row level security and define access policies
alter table public.resources enable row level security;

create policy if not exists "Public read active resources"
  on public.resources
  for select
  using (is_active = true);

create policy if not exists "Users can insert resources they own"
  on public.resources
  for insert
  to authenticated
  with check (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = created_by
    or coalesce(auth.jwt() ->> 'role', '') = 'admin'
  );

create policy if not exists "Users can update their resources"
  on public.resources
  for update
  to authenticated
  using (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = created_by
    or coalesce(auth.jwt() ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = created_by
    or coalesce(auth.jwt() ->> 'role', '') = 'admin'
  );

create policy if not exists "Users can delete their resources"
  on public.resources
  for delete
  to authenticated
  using (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = created_by
    or coalesce(auth.jwt() ->> 'role', '') = 'admin'
  );

-- Seed sample data for development and testing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.resources) THEN
    insert into public.resources (id, title, description, url, type, subject, stage, tags, thumbnail_url, created_by, is_active)
    values
      ('11111111-1111-4111-8111-111111111111', 'Math Morning Worksheet', 'Daily numeracy warm-up worksheet for early learners.', 'storage://resources/math-morning-worksheet.pdf', 'worksheet', 'Math', 'Stage 1', ARRAY['numeracy','morning-routine']::text[], 'https://cdn.example.com/thumbnails/math-morning.png', null, true),
      ('22222222-2222-4222-8222-222222222222', 'Phonics Song Video', 'Animated video introducing consonant blends.', 'https://videos.example.com/phonics-song', 'video', 'Phonics', 'Stage 2', ARRAY['phonics','listening','music']::text[], 'https://cdn.example.com/thumbnails/phonics-song.png', null, true),
      ('33333333-3333-4333-8333-333333333333', 'Science Lab Picture Cards', 'Printable picture cards for lab safety equipment.', 'storage://resources/science-lab-cards.zip', 'picture', 'Science', 'Stage 3', ARRAY['lab','safety','visual']::text[], 'https://cdn.example.com/thumbnails/science-lab.png', null, true),
      ('44444444-4444-4444-8444-444444444444', 'History Presentation Deck', 'Slides covering early explorers with discussion prompts.', 'https://cdn.example.com/presentations/history-explorers.pptx', 'ppt', 'Social Studies', 'Stage 4', ARRAY['exploration','discussion','project']::text[], 'https://cdn.example.com/thumbnails/history-explorers.png', null, true),
      ('55555555-5555-4555-8555-555555555555', 'Online Math Manipulatives', 'Interactive manipulatives for fractions and decimals.', 'https://apps.example.com/math-manipulatives', 'online', 'Math', 'Stage 5', ARRAY['fractions','interactive','technology']::text[], 'https://cdn.example.com/thumbnails/math-manipulatives.png', null, true),
      ('66666666-6666-4666-8666-666666666666', 'Outdoor Team Challenge', 'Offline cooperative activity focused on problem solving.', 'storage://resources/outdoor-team-challenge.pdf', 'offline', 'Physical Education', 'Stage 6', ARRAY['teamwork','problem-solving','outdoor']::text[], 'https://cdn.example.com/thumbnails/outdoor-challenge.png', null, true),
      ('77777777-7777-4777-8777-777777777777', 'Creative Writing Worksheet', 'Prompts and graphic organizers for narrative writing.', 'storage://resources/creative-writing-pack.pdf', 'worksheet', 'English', 'Stage 7', ARRAY['writing','literacy','creative']::text[], 'https://cdn.example.com/thumbnails/creative-writing.png', null, true),
      ('88888888-8888-4888-8888-888888888888', 'STEM Project Video Guide', 'Step-by-step video guide for building a wind turbine model.', 'https://videos.example.com/wind-turbine-guide', 'video', 'Science', 'Grade 5', ARRAY['stem','engineering','project-based']::text[], 'https://cdn.example.com/thumbnails/wind-turbine.png', null, true),
      ('99999999-9999-4999-8999-999999999999', 'Art Appreciation Image Pack', 'High-resolution artworks for classroom critique sessions.', 'storage://resources/art-appreciation-pack.zip', 'picture', 'Art', 'Grade 2', ARRAY['art','critique','visual-literacy']::text[], 'https://cdn.example.com/thumbnails/art-pack.png', null, true),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Kindergarten Circle Time Slides', 'PPT deck with songs, routines, and calendar review.', 'https://cdn.example.com/presentations/kindergarten-circle-time.pptx', 'ppt', 'Early Childhood', 'Kindergarten', ARRAY['circle-time','songs','calendar']::text[], 'https://cdn.example.com/thumbnails/circle-time.png', null, true);
  END IF;
END $$;
