-- Builder workflow persistence tables
create table if not exists public.builder_activity_recents (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  activity_slug text not null references public.tools_activities(slug) on delete cascade,
  metadata jsonb,
  last_viewed timestamptz not null default now(),
  unique(anon_user_id, activity_slug)
);

create index if not exists idx_builder_activity_recents_user
  on public.builder_activity_recents (anon_user_id, last_viewed desc);

create table if not exists public.builder_activity_favorites (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  activity_slug text not null references public.tools_activities(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique(anon_user_id, activity_slug)
);

create index if not exists idx_builder_activity_favorites_user
  on public.builder_activity_favorites (anon_user_id, created_at desc);

create table if not exists public.builder_collections (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_builder_collections_user
  on public.builder_collections (anon_user_id, created_at desc);

create table if not exists public.builder_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.builder_collections(id) on delete cascade,
  activity_slug text not null references public.tools_activities(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique(collection_id, activity_slug)
);

create table if not exists public.builder_drafts (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  title text not null default 'Untitled Lesson',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint builder_drafts_anon_user_unique unique (anon_user_id)
);

create index if not exists idx_builder_drafts_updated
  on public.builder_drafts (updated_at desc);

create table if not exists public.builder_resource_links (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.builder_drafts(id) on delete cascade,
  step_id uuid not null,
  label text not null,
  url text not null,
  last_synced timestamptz not null default now(),
  unique(draft_id, step_id, url)
);

create index if not exists idx_builder_resource_links_url
  on public.builder_resource_links (url);

create table if not exists public.builder_link_health_reports (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  status_code integer,
  status_text text,
  is_healthy boolean not null default true,
  failure_count integer not null default 0,
  last_checked timestamptz not null default now()
);

alter table public.builder_link_health_reports
  add column if not exists last_error text;

create policy if not exists "Allow anonymous read builder recents"
  on public.builder_activity_recents
  for select using (true);

create policy if not exists "Allow anonymous upsert builder recents"
  on public.builder_activity_recents
  for insert
  with check (true);

create policy if not exists "Allow anonymous update builder recents"
  on public.builder_activity_recents
  for update
  using (true)
  with check (true);

create policy if not exists "Allow anonymous read builder favorites"
  on public.builder_activity_favorites
  for select using (true);

create policy if not exists "Allow anonymous upsert builder favorites"
  on public.builder_activity_favorites
  for insert with check (true);

create policy if not exists "Allow anonymous delete builder favorites"
  on public.builder_activity_favorites
  for delete using (true);

create policy if not exists "Allow anonymous read builder collections"
  on public.builder_collections
  for select using (true);

create policy if not exists "Allow anonymous mutate builder collections"
  on public.builder_collections
  for all using (true) with check (true);

create policy if not exists "Allow anonymous read builder collection items"
  on public.builder_collection_items
  for select using (true);

create policy if not exists "Allow anonymous mutate builder collection items"
  on public.builder_collection_items
  for all using (true) with check (true);

create policy if not exists "Allow anonymous upsert builder drafts"
  on public.builder_drafts
  for all using (true) with check (true);

create policy if not exists "Allow anonymous read builder resource links"
  on public.builder_resource_links
  for select using (true);

create policy if not exists "Allow anonymous mutate builder resource links"
  on public.builder_resource_links
  for all using (true) with check (true);

create policy if not exists "Allow anonymous read link health"
  on public.builder_link_health_reports
  for select using (true);
