-- Create worksheets table for printable and digital resources
create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text not null unique,
  overview text,
  stage text not null check (stage in ('K','1','2','3','4','5','6','7','8','9','10','11','12')),
  subjects text[] not null default '{}'::text[],
  skills text[] not null default '{}'::text[],
  worksheet_type text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  format text not null check (format in ('pdf','digital')),
  tech_integrated boolean not null default false,
  thumbnail_url text,
  page_images text[] not null default '{}'::text[],
  pdf_url text,
  answer_key_url text,
  language text not null default 'en',
  tags text[] not null default '{}'::text[],
  status text not null default 'published' check (status in ('draft','published')),
  author_id uuid references auth.users(id),
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(overview, '') || ' ' ||
      coalesce(array_to_string(skills, ' '), '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) stored,
  has_answer_key boolean generated always as (answer_key_url is not null) stored
);

-- keep updated_at current
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists worksheets_updated_at on public.worksheets;
create trigger worksheets_updated_at
  before update on public.worksheets
  for each row
  execute function public.handle_updated_at();

create index if not exists worksheets_search_idx
  on public.worksheets using gin (search_vector);

create index if not exists worksheets_subjects_idx
  on public.worksheets using gin (subjects);

create index if not exists worksheets_skills_idx
  on public.worksheets using gin (skills);

create index if not exists worksheets_tags_idx
  on public.worksheets using gin (tags);

alter table public.worksheets enable row level security;

create policy if not exists "Public can read published worksheets"
  on public.worksheets
  for select
  using (status = 'published');

create policy if not exists "Service role can manage worksheets"
  on public.worksheets
  for all
  using (auth.role() = 'service_role')
  with check (true);
