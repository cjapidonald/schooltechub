-- Create lesson_plans table with search support and RLS policies
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text not null unique,
  summary text,
  subject text,
  grade_levels text[] not null default '{}'::text[],
  duration_minutes integer,
  objectives text[] not null default '{}'::text[],
  materials text[] not null default '{}'::text[],
  activities jsonb not null default '[]'::jsonb,
  standards text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(objectives, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'D')
  ) stored
);

drop trigger if exists lesson_plans_updated_at on public.lesson_plans;

create trigger lesson_plans_updated_at
  before update on public.lesson_plans
  for each row
  execute function public.update_updated_at_column();

create index if not exists lesson_plans_search_idx
  on public.lesson_plans using gin (search_vector);

create index if not exists lesson_plans_tags_idx
  on public.lesson_plans using gin (tags);

create index if not exists lesson_plans_grade_levels_idx
  on public.lesson_plans using gin (grade_levels);

-- Seed published lesson plans for local/testing environments
insert into public.lesson_plans (
  title,
  slug,
  summary,
  subject,
  grade_levels,
  duration_minutes,
  objectives,
  materials,
  activities,
  standards,
  tags,
  status
) values
  (
    'Introduction to Fractions',
    'introduction-to-fractions',
    'Students explore fractions through manipulatives and collaborative problem solving.',
    'Mathematics',
    array['Grade 3', 'Grade 4'],
    45,
    array[
      'Students will identify fractions as parts of a whole.',
      'Students will represent fractions using area models.'
    ],
    array['Fraction tiles', 'Whiteboard', 'Exit ticket worksheet'],
    jsonb_build_array(
      jsonb_build_object('step', 'Warm Up', 'description', 'Review equal parts using shapes.'),
      jsonb_build_object('step', 'Guided Practice', 'description', 'Use fraction tiles to model halves and quarters.'),
      jsonb_build_object('step', 'Exit Ticket', 'description', 'Students create their own fraction model.')
    ),
    array['CCSS.MATH.CONTENT.3.NF.A.1'],
    array['fractions', 'numeracy', 'hands-on'],
    'published'
  ),
  (
    'Community Helpers Writing Workshop',
    'community-helpers-writing-workshop',
    'Learners draft short informational paragraphs about community helpers and share with peers.',
    'English Language Arts',
    array['Grade 2'],
    50,
    array[
      'Students will research a community helper and identify key responsibilities.',
      'Students will write a focused informational paragraph with a topic sentence and details.'
    ],
    array['Chart paper', 'Chromebooks or tablets', 'Anchor chart markers'],
    jsonb_build_array(
      jsonb_build_object('step', 'Mini Lesson', 'description', 'Model drafting an informational paragraph about firefighters.'),
      jsonb_build_object('step', 'Writing Workshop', 'description', 'Students draft and revise their paragraphs in pairs.'),
      jsonb_build_object('step', 'Author Share', 'description', 'Volunteers read their paragraphs aloud for feedback.')
    ),
    array['CCSS.ELA-LITERACY.W.2.2'],
    array['writing', 'community', 'literacy'],
    'published'
  ),
  (
    'Ecosystems Field Investigation',
    'ecosystems-field-investigation',
    'Students analyze biotic and abiotic factors during an outdoor ecosystem walk.',
    'Science',
    array['Grade 5'],
    60,
    array[
      'Students will differentiate between biotic and abiotic components of an ecosystem.',
      'Students will collect observational data and summarize findings.'
    ],
    array['Field notebooks', 'Clipboards', 'Temperature probes'],
    jsonb_build_array(
      jsonb_build_object('step', 'Pre-Trip Briefing', 'description', 'Review safety expectations and observation focus areas.'),
      jsonb_build_object('step', 'Field Walk', 'description', 'Teams collect observations using data tables.'),
      jsonb_build_object('step', 'Debrief', 'description', 'Class discusses patterns found in the ecosystem.')
    ),
    array['NGSS.5-LS2-1'],
    array['ecosystems', 'science', 'field-study'],
    'published'
  )
  on conflict (slug) do nothing;

-- Apply RLS policies
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

create policy if not exists "Public can read published lesson plans"
  on public.lesson_plans
  for select
  using (status = 'published');

create policy if not exists "Service role can manage lesson plans"
  on public.lesson_plans
  for all
  using (auth.role() = 'service_role')
  with check (true);
