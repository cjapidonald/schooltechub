-- Ensure required extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- Drop existing table to migrate schema
alter table if exists public.resources disable row level security;
drop table if exists public.resources cascade;

-- Create unified resources table
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  url text,
  storage_path text,
  type text not null check (type in ('worksheet','video','picture','ppt','online','offline')),
  subject text,
  stage text,
  tags text[] not null default '{}'::text[],
  thumbnail_url text,
  created_by uuid references auth.users (id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes for search and filtering
create index idx_resources_title_trgm
  on public.resources using gin (title gin_trgm_ops);

create index idx_resources_tags_gin
  on public.resources using gin (tags);

create index idx_resources_filter_btree
  on public.resources (type, subject, stage, status, is_active);

-- Enable row level security and policies
alter table public.resources enable row level security;

create policy "Public read approved active resources"
  on public.resources
  for select
  to public
  using (is_active = true and status = 'approved');

create policy "Users insert their own resources"
  on public.resources
  for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Users update their own resources"
  on public.resources
  for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Users delete their own resources"
  on public.resources
  for delete
  to authenticated
  using (auth.uid() = created_by);

create policy "Admins can update any resource"
  on public.resources
  for update
  to authenticated
  using (coalesce(request.jwt() ->> 'role', '') = 'admin')
  with check (coalesce(request.jwt() ->> 'role', '') = 'admin');

-- Seed data representing a variety of resources
with seed_users as (
  select
    '00000000-0000-0000-0000-000000000001'::uuid as educator_id,
    '10000000-0000-0000-0000-000000000000'::uuid as admin_id
)
insert into public.resources (title, description, url, storage_path, type, subject, stage, tags, thumbnail_url, created_by, status, approved_by, approved_at, is_active)
select * from (
  values
    ('Literacy Warm-Up Worksheet', 'Morning literacy worksheet focusing on sight words.', null, 'resources/literacy-warmup.pdf', 'worksheet', 'English', 'Stage 1', ARRAY['literacy','sight-words'], 'https://cdn.example.com/thumbs/literacy-warmup.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '14 days', true),
    ('Number Bonds Video Lesson', 'Short animated video explaining number bonds to 20.', 'https://videos.example.com/number-bonds', null, 'video', 'Math', 'Stage 2', ARRAY['number-bonds','animated'], 'https://cdn.example.com/thumbs/number-bonds.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '13 days', true),
    ('Science Lab Safety Poster', 'Printable poster outlining key safety rules.', null, 'resources/science-lab-safety.pdf', 'picture', 'Science', 'Stage 3', ARRAY['lab','safety','poster'], 'https://cdn.example.com/thumbs/lab-safety.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '12 days', true),
    ('Explorers Presentation Deck', 'Slides introducing famous global explorers.', 'https://cdn.example.com/decks/explorers.pptx', null, 'ppt', 'Social Studies', 'Stage 4', ARRAY['history','geography'], 'https://cdn.example.com/thumbs/explorers.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '11 days', true),
    ('Interactive Fractions Lab', 'Online interactive tool for practicing fractions.', 'https://apps.example.com/fractions-lab', null, 'online', 'Math', 'Stage 5', ARRAY['fractions','interactive'], 'https://cdn.example.com/thumbs/fractions.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '10 days', true),
    ('Outdoor Team Building Challenge', 'Offline activity focused on collaboration and problem solving.', null, 'resources/outdoor-team-challenge.pdf', 'offline', 'Physical Education', 'Stage 6', ARRAY['teamwork','outdoor'], 'https://cdn.example.com/thumbs/team-challenge.png', (select educator_id from seed_users), 'approved', (select admin_id from seed_users), now() - interval '9 days', true),
    ('Creative Writing Prompt Pack', 'Collection of narrative writing prompts for middle school.', null, 'resources/creative-writing-prompts.pdf', 'worksheet', 'English', 'Stage 7', ARRAY['writing','creative'], 'https://cdn.example.com/thumbs/writing-prompts.png', (select educator_id from seed_users), 'pending', null, null, true),
    ('Wind Turbine Build Video Guide', 'Step-by-step guide for constructing a model wind turbine.', 'https://videos.example.com/wind-turbine', null, 'video', 'Science', 'Stage 5', ARRAY['stem','engineering'], 'https://cdn.example.com/thumbs/wind-turbine.png', (select educator_id from seed_users), 'pending', null, null, true),
    ('Art Critique Image Collection', 'High resolution artworks for classroom critique activities.', null, 'resources/art-critique-pack.zip', 'picture', 'Art', 'Stage 2', ARRAY['art','visual'], 'https://cdn.example.com/thumbs/art-critique.png', (select educator_id from seed_users), 'pending', null, null, true),
    ('Renewable Energy Slide Deck', 'PPT on renewable energy sources and classroom discussion questions.', 'https://cdn.example.com/decks/renewable-energy.pptx', null, 'ppt', 'Science', 'Stage 6', ARRAY['energy','sustainability'], 'https://cdn.example.com/thumbs/renewable.png', (select educator_id from seed_users), 'pending', null, null, true),
    ('Digital Citizenship WebQuest', 'Online webquest guiding students through digital citizenship scenarios.', 'https://quests.example.com/digital-citizenship', null, 'online', 'Technology', 'Stage 4', ARRAY['digital','citizenship'], 'https://cdn.example.com/thumbs/digital-citizenship.png', (select educator_id from seed_users), 'pending', null, null, true),
    ('Mindful Movement Routine', 'Offline routine integrating mindfulness and light exercise.', null, 'resources/mindful-movement.pdf', 'offline', 'Wellbeing', 'Stage 3', ARRAY['mindfulness','movement'], 'https://cdn.example.com/thumbs/mindful-movement.png', (select educator_id from seed_users), 'pending', null, null, true)
) as seed(title, description, url, storage_path, type, subject, stage, tags, thumbnail_url, created_by, status, approved_by, approved_at, is_active)
on conflict do nothing;
