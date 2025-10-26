create extension if not exists "uuid-ossp";

drop table if exists lesson_plan_standards cascade;
drop table if exists lesson_plan_steps cascade;
drop table if exists lesson_plan_sections cascade;
drop table if exists plan_versions cascade;
drop table if exists lesson_plans cascade;
drop table if exists activities cascade;
drop table if exists standards cascade;

create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references auth.users(id),
  title text not null,
  summary text,
  url text,
  url_domain text,
  url_type text check (url_type in ('video','doc','game','slide','site')),
  oembed jsonb,
  thumbnail_url text,
  favicon_url text,
  duration_min int,
  stage text,
  subjects text[],
  skills text[],
  grouping text check (grouping in ('whole','pairs','groups','individual')),
  delivery_mode text check (delivery_mode in ('offline','blended','online')),
  materials text[],
  tech_tools text[],
  tags text[],
  language text default 'en',
  visibility text default 'private' check (visibility in ('private','org','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references auth.users(id),
  title text not null,
  slug text unique,
  stage text,
  subjects text[],
  delivery_mode text check (delivery_mode in ('offline','blended','online')),
  class_size int,
  language text default 'en',
  target_duration_min int,
  meta jsonb,
  status text default 'draft' check (status in ('draft','published')),
  share_access text default 'private' check (share_access in ('private','link','org','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists lesson_plan_sections (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references lesson_plans(id) on delete cascade,
  key text not null,
  title text not null,
  order_index int not null default 0,
  visible boolean not null default true,
  notes text,
  settings jsonb,
  unique (plan_id, key)
);

create table if not exists lesson_plan_steps (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references lesson_plans(id) on delete cascade,
  section_id uuid not null references lesson_plan_sections(id) on delete cascade,
  activity_id uuid references activities(id),
  title text not null,
  description text,
  duration_min int default 5,
  grouping text check (grouping in ('whole','pairs','groups','individual')),
  materials text[],
  tech_tools text[],
  success_criteria text[],
  differentiation jsonb,
  resources jsonb,
  order_index int not null default 0
);

create table if not exists standards (
  id uuid primary key default uuid_generate_v4(),
  framework text not null,
  code text not null,
  label text not null,
  stage text,
  subject text
);

create table if not exists lesson_plan_standards (
  plan_id uuid not null references lesson_plans(id) on delete cascade,
  standard_id uuid not null references standards(id) on delete cascade,
  primary key (plan_id, standard_id)
);

create table if not exists plan_versions (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references lesson_plans(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_activities_subjects on activities using gin (subjects);
create index if not exists idx_activities_skills on activities using gin (skills);
create index if not exists idx_activities_tags on activities using gin (tags);
create index if not exists idx_activities_domain on activities (url_domain);

alter table activities enable row level security;
alter table lesson_plans enable row level security;
alter table lesson_plan_sections enable row level security;
alter table lesson_plan_steps enable row level security;

create policy if not exists "activities_owner_rw" on activities
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy if not exists "lesson_plans_owner_rw" on lesson_plans
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy if not exists "sections_owner_rw" on lesson_plan_sections
  for all using (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.author_id = auth.uid()
    )
  );

create policy if not exists "steps_owner_rw" on lesson_plan_steps
  for all using (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.author_id = auth.uid()
    )
  );

create policy if not exists "lesson_plans_shared_read" on lesson_plans for select
  using (share_access in ('link','org','public'));

create policy if not exists "sections_shared_read" on lesson_plan_sections for select
  using (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.share_access in ('link','org','public')
    )
  );

create policy if not exists "steps_shared_read" on lesson_plan_steps for select
  using (
    exists (
      select 1 from lesson_plans p
      where p.id = plan_id and p.share_access in ('link','org','public')
    )
  );
