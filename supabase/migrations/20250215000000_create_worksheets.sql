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

-- Seed a variety of worksheets for local development/testing
insert into public.worksheets (
  title,
  slug,
  overview,
  stage,
  subjects,
  skills,
  worksheet_type,
  difficulty,
  format,
  tech_integrated,
  thumbnail_url,
  page_images,
  pdf_url,
  answer_key_url,
  language,
  tags,
  status,
  published_at
) values
  (
    'Phonics OR Sound Hunt',
    'phonics-or-sound-hunt',
    'Learners practice decoding words with the "or" sound using a scavenger hunt style printable.',
    '1',
    array['English'],
    array['phonics-or','reading'],
    'practice',
    'easy',
    'pdf',
    false,
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    array['https://images.unsplash.com/photo-1584697964403-67de2743ff77?auto=format&fit=crop&w=800&q=80'],
    'https://example.com/worksheets/phonics-or-sound-hunt.pdf',
    null,
    'en',
    array['literacy','early-reading'],
    'published',
    now() - interval '12 days'
  ),
  (
    'Fraction Station Rotation',
    'fraction-station-rotation',
    'Students rotate through digital stations comparing fractions with visual models and drag-and-drop practice.',
    '4',
    array['Math'],
    array['fractions','comparison'],
    'station',
    'medium',
    'digital',
    true,
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    array[
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80'
    ],
    null,
    'https://example.com/worksheets/fraction-station-rotation-answers.pdf',
    'en',
    array['math','interactive','fractions'],
    'published',
    now() - interval '7 days'
  ),
  (
    'Ecosystems Field Notes',
    'ecosystems-field-notes',
    'Printable observation log for documenting producers, consumers, and decomposers during an outdoor investigation.',
    '6',
    array['Science'],
    array['ecosystems','observation'],
    'project',
    'medium',
    'pdf',
    false,
    'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=600&q=80',
    array['https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80'],
    'https://example.com/worksheets/ecosystems-field-notes.pdf',
    'https://example.com/worksheets/ecosystems-field-notes-answers.pdf',
    'en',
    array['science','fieldwork'],
    'published',
    now() - interval '3 days'
  ),
  (
    'AI Ethics Scenario Cards',
    'ai-ethics-scenario-cards',
    'Small-group discussion prompts exploring ethical considerations for classroom AI tools.',
    '9',
    array['Technology','English'],
    array['ai-ethics','discussion'],
    'discussion',
    'hard',
    'digital',
    true,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
    array['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'],
    null,
    null,
    'en',
    array['ai','ethics','discussion'],
    'published',
    now() - interval '1 day'
  )
  on conflict (slug) do nothing;

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
