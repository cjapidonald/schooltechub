alter table if exists public.lesson_plans
  add column if not exists school_logo_url text,
  add column if not exists lesson_date date;

alter table if exists public.profiles
  add column if not exists school_logo_url text;

-- Backfill lesson plan logos from profile data when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lesson_plans'
      AND column_name = 'owner_id'
  ) THEN
    UPDATE public.lesson_plans lp
    SET school_logo_url = COALESCE(lp.school_logo_url, p.school_logo_url)
    FROM public.profiles p
    WHERE lp.owner_id = p.id
      AND p.school_logo_url IS NOT NULL
      AND (lp.school_logo_url IS NULL OR lp.school_logo_url = '');
  END IF;
END $$;

-- Extend lesson plan steps with learning goal metadata
alter table if exists public.lesson_plan_steps
  add column if not exists learning_goals text,
  add column if not exists delivery_mode text
    check (delivery_mode in ('offline','blended','online'));

-- Create resource catalog for lesson plans
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lesson_plan_id uuid references public.lesson_plans(id) on delete set null,
  step_id uuid references public.lesson_plan_steps(id) on delete set null,
  title text not null,
  summary text,
  description text,
  url text,
  download_url text,
  thumbnail_url text,
  provider text,
  resource_type text not null check (resource_type in ('video','article','worksheet','template','interactive','tool','other')),
  delivery_mode text check (delivery_mode in ('offline','blended','online')),
  learning_goals text,
  subjects text[] not null default '{}'::text[],
  grade_levels text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  language text not null default 'en',
  duration_minutes integer,
  cost text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) stored
);

drop trigger if exists resources_set_updated_at on public.resources;

create trigger resources_set_updated_at
  before update on public.resources
  for each row
  execute function public.update_updated_at_column();

create index if not exists resources_search_idx
  on public.resources using gin (search_vector);

create index if not exists resources_tags_idx
  on public.resources using gin (tags);

create index if not exists resources_subjects_idx
  on public.resources using gin (subjects);

create index if not exists resources_grade_levels_idx
  on public.resources using gin (grade_levels);

create index if not exists resources_lesson_plan_idx
  on public.resources (lesson_plan_id);

create index if not exists resources_step_idx
  on public.resources (step_id);

alter table public.resources enable row level security;

create policy if not exists "Public can read published resources"
  on public.resources
  for select
  using (status = 'published');

create policy if not exists "Service role can manage resources"
  on public.resources
  for all
  using (auth.role() = 'service_role')
  with check (true);
