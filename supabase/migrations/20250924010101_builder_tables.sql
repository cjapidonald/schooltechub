-- Migration: create builder tables and migrate legacy lesson plans
set check_function_bodies = off;

-- Ensure required extensions
create extension if not exists "pgcrypto" with schema public;
create extension if not exists "uuid-ossp" with schema public;
create extension if not exists "pg_trgm" with schema public;

-- Preserve legacy lesson plans data for migration
alter table if exists public.lesson_plans rename to lesson_plans_legacy;

-- Drop leftover indexes from legacy table if present
drop index if exists lesson_plans_search_idx;
drop index if exists lesson_plans_tags_idx;
drop index if exists lesson_plans_grade_levels_idx;

-- Create lesson stage enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_stage') THEN
    CREATE TYPE public.lesson_stage AS ENUM (
      'early childhood',
      'elementary',
      'middle school',
      'high school',
      'adult learners'
    );
  END IF;
END
$$;

-- Create delivery mode enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_delivery_mode') THEN
    CREATE TYPE public.lesson_delivery_mode AS ENUM (
      'in-person',
      'blended',
      'online',
      'project-based',
      'flipped'
    );
  END IF;
END
$$;

-- Builder activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  stage lesson_stage not null,
  delivery_modes lesson_delivery_mode[] not null default '{}'::lesson_delivery_mode[],
  subjects text[] not null default '{}'::text[],
  technology_tags text[] not null default '{}'::text[],
  duration_minutes integer,
  materials text[] not null default '{}'::text[],
  share_code uuid not null default gen_random_uuid(),
  shared_with uuid[] not null default '{}'::uuid[],
  resource_url text,
  resource_domain text generated always as (
    case
      when resource_url is null then null
      else lower(regexp_replace(split_part(resource_url, '/', 3), '^www\\.', ''))
    end
  ) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger activities_updated_at
  before update on public.activities
  for each row
  execute function public.update_updated_at_column();

create index if not exists activities_subjects_idx on public.activities using gin (subjects);
create index if not exists activities_delivery_modes_idx on public.activities using gin (delivery_modes);
create index if not exists activities_technology_tags_idx on public.activities using gin (technology_tags);
create index if not exists activities_shared_with_idx on public.activities using gin (shared_with);
create index if not exists activities_domain_trgm_idx on public.activities using gin (resource_domain gin_trgm_ops);

-- Builder lesson plans table
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text,
  overview jsonb not null default '{}'::jsonb,
  notes text,
  stage lesson_stage,
  subjects text[] not null default '{}'::text[],
  delivery_modes lesson_delivery_mode[] not null default '{}'::lesson_delivery_mode[],
  technology_tags text[] not null default '{}'::text[],
  grade_levels text[] not null default '{}'::text[],
  duration_minutes integer,
  tags text[] not null default '{}'::text[],
  status text not null default 'draft' check (status in ('draft','published','archived')),
  share_code uuid not null default gen_random_uuid(),
  shared_with uuid[] not null default '{}'::uuid[],
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(subjects, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'D')
  ) stored
);

create trigger lesson_plans_updated_at
  before update on public.lesson_plans
  for each row
  execute function public.update_updated_at_column();

create index if not exists lesson_plans_search_idx
  on public.lesson_plans using gin (search_vector);
create index if not exists lesson_plans_subjects_idx
  on public.lesson_plans using gin (subjects);
create index if not exists lesson_plans_delivery_idx
  on public.lesson_plans using gin (delivery_modes);
create index if not exists lesson_plans_tech_idx
  on public.lesson_plans using gin (technology_tags);
create index if not exists lesson_plans_grade_levels_idx
  on public.lesson_plans using gin (grade_levels);
create index if not exists lesson_plans_shared_with_idx
  on public.lesson_plans using gin (shared_with);

-- Sections and steps
create table if not exists public.lesson_plan_sections (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lesson_plan_sections_updated_at
  before update on public.lesson_plan_sections
  for each row
  execute function public.update_updated_at_column();

create index if not exists lesson_plan_sections_plan_idx
  on public.lesson_plan_sections (plan_id, position);

create table if not exists public.lesson_plan_steps (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.lesson_plan_sections (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete set null,
  title text not null,
  instructions text,
  stage lesson_stage,
  delivery_modes lesson_delivery_mode[] not null default '{}'::lesson_delivery_mode[],
  materials text[] not null default '{}'::text[],
  technology_tags text[] not null default '{}'::text[],
  duration_minutes integer,
  resource_url text,
  resource_domain text generated always as (
    case
      when resource_url is null then null
      else lower(regexp_replace(split_part(resource_url, '/', 3), '^www\\.', ''))
    end
  ) stored,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lesson_plan_steps_updated_at
  before update on public.lesson_plan_steps
  for each row
  execute function public.update_updated_at_column();

create index if not exists lesson_plan_steps_section_idx
  on public.lesson_plan_steps (section_id, position);
create index if not exists lesson_plan_steps_delivery_idx
  on public.lesson_plan_steps using gin (delivery_modes);
create index if not exists lesson_plan_steps_materials_idx
  on public.lesson_plan_steps using gin (materials);
create index if not exists lesson_plan_steps_tech_idx
  on public.lesson_plan_steps using gin (technology_tags);
create index if not exists lesson_plan_steps_domain_idx
  on public.lesson_plan_steps using gin (resource_domain gin_trgm_ops);

-- Standards catalog
create table if not exists public.standards (
  id uuid primary key default gen_random_uuid(),
  framework text not null,
  code text not null,
  description text,
  grade_band text,
  subject text,
  url text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standards_framework_code_unique unique (framework, code)
);

create trigger standards_updated_at
  before update on public.standards
  for each row
  execute function public.update_updated_at_column();

create index if not exists standards_framework_idx on public.standards (framework);
create index if not exists standards_grade_band_idx on public.standards (grade_band);

-- Lesson plan standards mapping
create table if not exists public.lesson_plan_standards (
  plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  standard_id uuid not null references public.standards (id) on delete cascade,
  is_primary boolean not null default false,
  aligned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, standard_id)
);

create trigger lesson_plan_standards_updated_at
  before update on public.lesson_plan_standards
  for each row
  execute function public.update_updated_at_column();

-- Plan versions
create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint plan_versions_unique_version unique (plan_id, version)
);

create index if not exists plan_versions_plan_idx on public.plan_versions (plan_id, version);

-- Enable RLS and policies
alter table public.activities enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_sections enable row level security;
alter table public.lesson_plan_steps enable row level security;
alter table public.standards enable row level security;
alter table public.lesson_plan_standards enable row level security;
alter table public.plan_versions enable row level security;

-- Activities policies
create policy if not exists "Activities owner manage"
  on public.activities
  for all
  using (auth.uid() = owner_id or auth.role() = 'service_role')
  with check (auth.uid() = owner_id or auth.role() = 'service_role');

create policy if not exists "Activities shared read"
  on public.activities
  for select
  using (
    auth.uid() = owner_id or
    auth.uid() = any(shared_with) or
    auth.role() = 'service_role' or
    (
      share_code is not null and
      nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = share_code::text
    )
  );

-- Lesson plan policies
create policy if not exists "Lesson plan owner manage"
  on public.lesson_plans
  for all
  using (auth.uid() = owner_id or auth.role() = 'service_role')
  with check (auth.uid() = owner_id or auth.role() = 'service_role');

create policy if not exists "Lesson plan shared read"
  on public.lesson_plans
  for select
  using (
    auth.uid() = owner_id or
    auth.uid() = any(shared_with) or
    auth.role() = 'service_role' or
    (
      share_code is not null and
      nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = share_code::text
    )
  );

create policy if not exists "Published lesson plans are public"
  on public.lesson_plans
  for select
  using (status = 'published');

-- Helper expression for referencing parent plan permissions
create or replace view public.lesson_plan_permissions as
  select
    p.id as plan_id,
    p.owner_id,
    p.shared_with,
    p.share_code,
    p.status
  from public.lesson_plans p;

-- Sections policies
create policy if not exists "Sections owner manage"
  on public.lesson_plan_sections
  for all
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_sections.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  )
  with check (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_sections.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  );

create policy if not exists "Sections shared read"
  on public.lesson_plan_sections
  for select
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_sections.plan_id
        and (
          perm.owner_id = auth.uid() or
          auth.uid() = any(perm.shared_with) or
          auth.role() = 'service_role' or
          (
            perm.share_code is not null and
            nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = perm.share_code::text
          ) or
          perm.status = 'published'
        )
    )
  );

-- Steps policies
create policy if not exists "Steps owner manage"
  on public.lesson_plan_steps
  for all
  using (
    exists (
      select 1
      from public.lesson_plan_sections s
      join public.lesson_plan_permissions perm on perm.plan_id = s.plan_id
      where s.id = lesson_plan_steps.section_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  )
  with check (
    exists (
      select 1
      from public.lesson_plan_sections s
      join public.lesson_plan_permissions perm on perm.plan_id = s.plan_id
      where s.id = lesson_plan_steps.section_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  );

create policy if not exists "Steps shared read"
  on public.lesson_plan_steps
  for select
  using (
    exists (
      select 1
      from public.lesson_plan_sections s
      join public.lesson_plan_permissions perm on perm.plan_id = s.plan_id
      where s.id = lesson_plan_steps.section_id
        and (
          perm.owner_id = auth.uid() or
          auth.uid() = any(perm.shared_with) or
          auth.role() = 'service_role' or
          (
            perm.share_code is not null and
            nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = perm.share_code::text
          ) or
          perm.status = 'published'
        )
    )
  );

-- Standards policies
create policy if not exists "Standards read"
  on public.standards
  for select
  using (true);

create policy if not exists "Standards manage"
  on public.standards
  for all
  using (auth.role() = 'service_role' or created_by = auth.uid())
  with check (auth.role() = 'service_role' or created_by = auth.uid());

-- Lesson plan standards policies
create policy if not exists "Plan standards owner manage"
  on public.lesson_plan_standards
  for all
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_standards.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  )
  with check (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_standards.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  );

create policy if not exists "Plan standards shared read"
  on public.lesson_plan_standards
  for select
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = lesson_plan_standards.plan_id
        and (
          perm.owner_id = auth.uid() or
          auth.uid() = any(perm.shared_with) or
          auth.role() = 'service_role' or
          (
            perm.share_code is not null and
            nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = perm.share_code::text
          ) or
          perm.status = 'published'
        )
    )
  );

-- Plan versions policies
create policy if not exists "Plan versions owner manage"
  on public.plan_versions
  for all
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = plan_versions.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  )
  with check (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = plan_versions.plan_id
        and (perm.owner_id = auth.uid() or auth.role() = 'service_role')
    )
  );

create policy if not exists "Plan versions shared read"
  on public.plan_versions
  for select
  using (
    exists (
      select 1
      from public.lesson_plan_permissions perm
      where perm.plan_id = plan_versions.plan_id
        and (
          perm.owner_id = auth.uid() or
          auth.uid() = any(perm.shared_with) or
          auth.role() = 'service_role' or
          (
            perm.share_code is not null and
            nullif(current_setting('request.jwt.claim.builder_share_code', true), '') = perm.share_code::text
          ) or
          perm.status = 'published'
        )
    )
  );

-- Migrate data from legacy table into new structure
with inserted_plans as (
  insert into public.lesson_plans (
    id,
    owner_id,
    slug,
    title,
    summary,
    overview,
    notes,
    stage,
    subjects,
    delivery_modes,
    technology_tags,
    grade_levels,
    duration_minutes,
    tags,
    status,
    published_at,
    created_at,
    updated_at
  )
  select
    legacy.id,
    uuid_nil(),
    legacy.slug,
    legacy.title,
    legacy.summary,
    jsonb_build_object(
      'objectives', to_jsonb(coalesce(legacy.objectives, '{}'::text[])),
      'materials', to_jsonb(coalesce(legacy.materials, '{}'::text[])),
      'gradeLevels', to_jsonb(coalesce(legacy.grade_levels, '{}'::text[]))
    ),
    null,
    null,
    case when legacy.subject is not null then array[legacy.subject] else array[]::text[] end,
    array[]::lesson_delivery_mode[],
    legacy.tags,
    legacy.grade_levels,
    legacy.duration_minutes,
    legacy.tags,
    legacy.status,
    case when legacy.status = 'published' then legacy.updated_at else null end,
    legacy.created_at,
    legacy.updated_at
  from public.lesson_plans_legacy legacy
  on conflict (id) do nothing
  returning id
), section_cte as (
  insert into public.lesson_plan_sections (
    plan_id,
    title,
    description,
    position
  )
  select
    p.id,
    'Lesson Activities',
    'Migrated from legacy lesson plan format',
    1
  from inserted_plans p
  returning id, plan_id
), step_insert as (
  insert into public.lesson_plan_steps (
    section_id,
    title,
    instructions,
    position
  )
  select
    s.id,
    coalesce(nullif(activity->>'step', ''), format('Step %s', elem.ord::text)),
    nullif(activity->>'description', ''),
    elem.ord::integer
  from section_cte s
  join public.lesson_plans_legacy legacy on legacy.id = s.plan_id
  cross join lateral jsonb_array_elements(coalesce(legacy.activities, '[]'::jsonb)) with ordinality as elem(activity, ord)
)
select 1;

-- Backfill standards catalog from legacy lesson plans
insert into public.standards (
  framework,
  code,
  description,
  grade_band,
  subject,
  created_by
)
select distinct
  split_part(code, '.', 1) as framework,
  code,
  null,
  null,
  legacy.subject,
  uuid_nil()
from public.lesson_plans_legacy legacy
cross join unnest(coalesce(legacy.standards, '{}'::text[])) as code
on conflict (framework, code) do nothing;

-- Link migrated lesson plans to their standards
insert into public.lesson_plan_standards (
  plan_id,
  standard_id,
  is_primary
)
select distinct
  lp.id,
  std.id,
  false
from public.lesson_plans lp
join public.lesson_plans_legacy legacy on legacy.id = lp.id
join unnest(coalesce(legacy.standards, '{}'::text[])) as code on true
join public.standards std
  on std.framework = split_part(code, '.', 1)
 and std.code = code
on conflict do nothing;

-- Create an initial snapshot version for each migrated lesson plan
insert into public.plan_versions (
  plan_id,
  version,
  snapshot,
  notes,
  created_by,
  created_at
)
select
  lp.id,
  1,
  jsonb_build_object(
    'plan', to_jsonb(lp) - 'search_vector',
    'sections', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'description', s.description,
          'position', s.position,
          'steps', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', st.id,
                'title', st.title,
                'instructions', st.instructions,
                'position', st.position,
                'activityId', st.activity_id,
                'durationMinutes', st.duration_minutes,
                'materials', st.materials,
                'technologyTags', st.technology_tags
              )
              order by st.position
            )
            from public.lesson_plan_steps st
            where st.section_id = s.id
          ), '[]'::jsonb)
        )
        order by s.position
      )
      from public.lesson_plan_sections s
      where s.plan_id = lp.id
    ), '[]'::jsonb)
  ),
  'Initial import from legacy lesson plan format',
  lp.owner_id,
  coalesce(lp.published_at, lp.created_at)
from public.lesson_plans lp
on conflict (plan_id, version) do nothing;

-- Seed representative activities for builder testing
insert into public.activities (
  owner_id,
  title,
  slug,
  summary,
  description,
  stage,
  delivery_modes,
  subjects,
  technology_tags,
  duration_minutes,
  materials,
  resource_url,
  metadata
)
values
  (uuid_nil(), 'AI Brainstorm Jam', 'ai-brainstorm-jam', 'Quick design-thinking sprints with AI prompts.',
    'Students rotate through idea stations where an AI assistant suggests variations and constraints.',
    'middle school', ARRAY['in-person','online']::lesson_delivery_mode[], ARRAY['Technology','ELA'], ARRAY['ai','collaboration'], 20,
    ARRAY['Laptops','Timer','Idea cards'], 'https://classroom.example.com/ai-brainstorm', jsonb_build_object('difficulty','medium')),
  (uuid_nil(), 'Community Podcast Lab', 'community-podcast-lab', 'Learners script, record, and publish a neighborhood story.',
    'Teams plan interview questions, capture audio with mobile devices, and edit episodes in a shared studio.',
    'high school', ARRAY['project-based','blended']::lesson_delivery_mode[], ARRAY['Media Arts','Social Studies'], ARRAY['audio','storytelling'], 55,
    ARRAY['Microphones','Editing software','Story map'], 'https://mediahub.example.com/podcast-lab', jsonb_build_object('product','podcast')),
  (uuid_nil(), 'Robotics Obstacle Missions', 'robotics-obstacle-missions', 'Intro robotics challenge emphasizing iteration.',
    'Pairs program bots to complete timed obstacle courses with debugging checkpoints.',
    'elementary', ARRAY['in-person']::lesson_delivery_mode[], ARRAY['STEM'], ARRAY['robotics','coding'], 40,
    ARRAY['Robotics kits','Stopwatch','Mission cards'], 'https://labs.example.com/robotics-missions', jsonb_build_object('alignment','ISTE 4')),
  (uuid_nil(), 'Virtual Field Notes', 'virtual-field-notes', 'Guided exploration of global ecosystems via VR scenes.',
    'Learners collect observations in shared journals while navigating a virtual field site.',
    'middle school', ARRAY['online','blended']::lesson_delivery_mode[], ARRAY['Science'], ARRAY['vr','data'], 35,
    ARRAY['VR headsets','Observation sheet'], 'https://expeditions.example.com/field-notes', jsonb_build_object('focus','ecosystems')),
  (uuid_nil(), 'Design Sprint Kickoff', 'design-sprint-kickoff', 'Set norms, define challenges, and ideate prototypes.',
    'Facilitator introduces sprint roles, empathy maps, and rapid sketching sessions.',
    'adult learners', ARRAY['in-person','project-based']::lesson_delivery_mode[], ARRAY['Professional Learning'], ARRAY['design thinking'], 60,
    ARRAY['Canvas','Sticky notes','Markers'], 'https://innovation.example.com/design-sprint', jsonb_build_object('audience','coaches')),
  (uuid_nil(), 'Literacy Makerspace', 'literacy-makerspace', 'Blend storytelling with simple circuits.',
    'Students craft narrative scenes that light up using paper circuits controlled by microbits.',
    'elementary', ARRAY['in-person','project-based']::lesson_delivery_mode[], ARRAY['ELA','STEM'], ARRAY['makerspace','coding'], 45,
    ARRAY['Cardstock','Copper tape','Micro:bits'], 'https://makers.example.com/literacy-light', jsonb_build_object('extension','family showcase')),
  (uuid_nil(), 'Data Story Hackathon', 'data-story-hackathon', 'Rapid data visualization challenge with public datasets.',
    'Small teams analyze community data and craft compelling visual narratives with interactive dashboards.',
    'high school', ARRAY['online','project-based']::lesson_delivery_mode[], ARRAY['Math','Civics'], ARRAY['data','storytelling'], 90,
    ARRAY['Spreadsheets','Presentation deck'], 'https://civicdata.example.com/story-hackathon', jsonb_build_object('deliverable','pitch deck')),
  (uuid_nil(), 'Mindful Movement Coding', 'mindful-movement-coding', 'Connect SEL routines to motion-based programming.',
    'Learners design calming movement sequences for a programmable robot companion.',
    'early childhood', ARRAY['in-person']::lesson_delivery_mode[], ARRAY['SEL','Technology'], ARRAY['robotics','wellness'], 25,
    ARRAY['Floor tape','Robot mat','Music playlist'], 'https://wellnesslab.example.com/mindful-motion', jsonb_build_object('signal','calming corner')),
  (uuid_nil(), 'Sustainable Cities Simulator', 'sustainable-cities-simulator', 'Collaborative planning challenge inside a sandbox sim.',
    'Teams propose zoning, transit, and energy policies while monitoring resource dashboards.',
    'middle school', ARRAY['online','project-based']::lesson_delivery_mode[], ARRAY['Geography','Science'], ARRAY['simulation','civic tech'], 70,
    ARRAY['Simulation licenses','Reflection journal'], 'https://simlab.example.com/green-cities', jsonb_build_object('assessment','rubric')),
  (uuid_nil(), 'Heritage Gallery Walk', 'heritage-gallery-walk', 'Students curate digital exhibits celebrating community heritage.',
    'Learners storyboard displays, digitize artifacts, and host a virtual gallery tour.',
    'elementary', ARRAY['blended','project-based']::lesson_delivery_mode[], ARRAY['Social Studies','Art'], ARRAY['digital storytelling','multimedia'], 50,
    ARRAY['Tablets','Scanner','QR labels'], 'https://culturehub.example.com/heritage-gallery', jsonb_build_object('culminating','family night')),
  (uuid_nil(), 'Industry Mentors Live', 'industry-mentors-live', 'Live Q&A series connecting learners with industry experts.',
    'Students prepare inquiry questions, host live sessions, and synthesize takeaways into action plans.',
    'high school', ARRAY['online','blended']::lesson_delivery_mode[], ARRAY['Career Readiness'], ARRAY['video','mentorship'], 45,
    ARRAY['Video conferencing platform','Question bank'], 'https://futurepath.example.com/mentors-live', jsonb_build_object('format','webinar')),
  (uuid_nil(), 'Family STEM Night Blueprint', 'family-stem-night-blueprint', 'Plan a community STEM celebration with rotating stations.',
    'Educators co-design take-home challenges and interactive demos for families.',
    'adult learners', ARRAY['in-person','project-based']::lesson_delivery_mode[], ARRAY['STEM','Family Engagement'], ARRAY['community','event design'], 75,
    ARRAY['Station kits','Feedback forms'], 'https://families.example.com/stem-blueprint', jsonb_build_object('support','checklist')),
  (uuid_nil(), 'Storyboarding with Generative Art', 'storyboarding-generative-art', 'Use AI image tools to storyboard narrative arcs.',
    'Learners iterate on prompts, critique outputs, and annotate story beats for a final pitch.',
    'middle school', ARRAY['online','in-person']::lesson_delivery_mode[], ARRAY['ELA','Media Arts'], ARRAY['ai','visual design'], 30,
    ARRAY['AI art tool','Storyboard template'], 'https://creativelab.example.com/genart-storyboards', jsonb_build_object('scaffolds','prompt library')),
  (uuid_nil(), 'Global Debates Forum', 'global-debates-forum', 'Asynchronous debate circles on global issues.',
    'Participants research, post arguments, and moderate peer responses using shared rubrics.',
    'high school', ARRAY['online']::lesson_delivery_mode[], ARRAY['Civics','ELA'], ARRAY['discussion','media literacy'], 120,
    ARRAY['Discussion board','Evidence tracker'], 'https://debates.example.com/global-forum', jsonb_build_object('cycle','weekly'))
on conflict (slug) do nothing;

-- Seed additional standards for builder testing
insert into public.standards (framework, code, description, grade_band, subject, url, created_by)
values
  ('ISTE', 'ISTE.4.6', 'Create computational artifacts to solve authentic problems.', 'Grades 6-8', 'Technology', 'https://iste.org/standards', uuid_nil()),
  ('NGSS', 'NGSS.MS-ETS1-2', 'Evaluate competing design solutions using a systematic process.', 'Grades 6-8', 'Science', 'https://nextgenscience.org', uuid_nil()),
  ('CCSS.ELA', 'CCSS.ELA-LITERACY.W.5.4', 'Produce clear and coherent writing appropriate to task.', 'Grade 5', 'ELA', 'https://www.corestandards.org', uuid_nil()),
  ('CCSS.MATH', 'CCSS.MATH.PRACTICE.MP4', 'Model with mathematics.', 'All Grades', 'Mathematics', 'https://www.corestandards.org', uuid_nil()),
  ('CSTA', 'CSTA.2-CS-02', 'Develop programs that use sequencing, events, loops, and conditionals.', 'Grades 3-5', 'Computer Science', 'https://www.csteachers.org', uuid_nil())
on conflict (framework, code) do nothing;

-- Clean up legacy table once data is migrated
drop table if exists public.lesson_plans_legacy;
