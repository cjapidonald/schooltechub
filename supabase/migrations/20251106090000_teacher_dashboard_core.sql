-- Core tables to support the teacher dashboard experience
create extension if not exists "uuid-ossp";

-- Students managed by a teacher
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users (id),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_owner on public.students (owner_id);

-- Enrolments connecting students to classes
create table if not exists public.class_students (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists idx_class_students_class on public.class_students (class_id);
create index if not exists idx_class_students_student on public.class_students (student_id);

-- Behaviour observations recorded by teachers
create table if not exists public.student_behavior_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  note text not null,
  sentiment text not null default 'neutral' check (sentiment in ('positive','neutral','needs_support')),
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id)
);

create index if not exists idx_student_behavior_student on public.student_behavior_logs (student_id);
create index if not exists idx_student_behavior_class on public.student_behavior_logs (class_id);

-- Celebration notes and appraisals
create table if not exists public.student_appraisals (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  highlight text not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id)
);

create index if not exists idx_student_appraisals_student on public.student_appraisals (student_id);
create index if not exists idx_student_appraisals_class on public.student_appraisals (class_id);

-- Requests to generate AI-powered progress reports
create table if not exists public.student_reports (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students (id) on delete cascade,
  requested_by uuid references auth.users (id),
  status text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  generated_url text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_student_reports_student on public.student_reports (student_id);
create index if not exists idx_student_reports_status on public.student_reports (status);

-- Curriculum rows planned by the educator
create table if not exists public.curriculum_items (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null,
  stage text,
  subject text,
  topic text,
  week int,
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_curriculum_items_class on public.curriculum_items (class_id);
create index if not exists idx_curriculum_items_date on public.curriculum_items (date);

-- Links between curriculum items and saved lesson plans
create table if not exists public.curriculum_lessons (
  id uuid primary key default uuid_generate_v4(),
  curriculum_item_id uuid not null references public.curriculum_items (id) on delete cascade,
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  view_url text,
  created_at timestamptz not null default now(),
  unique (curriculum_item_id, lesson_plan_id)
);

create index if not exists idx_curriculum_lessons_curriculum on public.curriculum_lessons (curriculum_item_id);
create index if not exists idx_curriculum_lessons_plan on public.curriculum_lessons (lesson_plan_id);

-- Assessments created for a class
create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  grading_scale text not null default 'letter' check (grading_scale in ('letter','percentage','points','rubric')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessments_class on public.assessments (class_id);
create index if not exists idx_assessments_due_date on public.assessments (due_date);

-- Student submissions for an assessment
create table if not exists public.assessment_submissions (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted')),
  submitted_at timestamptz,
  attachments jsonb not null default '[]'::jsonb
);

create index if not exists idx_assessment_submissions_assessment on public.assessment_submissions (assessment_id);
create index if not exists idx_assessment_submissions_student on public.assessment_submissions (student_id);

-- Grades and feedback recorded for assessments
create table if not exists public.assessment_grades (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  grade_value text,
  grade_numeric numeric,
  scale text not null default 'letter' check (scale in ('letter','percentage','points','rubric')),
  feedback text,
  graded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id)
);

create index if not exists idx_assessment_grades_assessment on public.assessment_grades (assessment_id);
create index if not exists idx_assessment_grades_student on public.assessment_grades (student_id);

-- Enable row level security and provide owner-scoped policies
alter table public.students enable row level security;
alter table public.class_students enable row level security;
alter table public.student_behavior_logs enable row level security;
alter table public.student_appraisals enable row level security;
alter table public.student_reports enable row level security;
alter table public.curriculum_items enable row level security;
alter table public.curriculum_lessons enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.assessment_grades enable row level security;

create policy if not exists "Students are owned by user" on public.students
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy if not exists "Manage class_students via owned classes" on public.class_students
  for all using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage behaviour for owned students" on public.student_behavior_logs
  for all using (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage appraisals for owned students" on public.student_appraisals
  for all using (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage reports for owned students" on public.student_reports
  for all using (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage curriculum for owned classes" on public.curriculum_items
  for all using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage curriculum lesson links" on public.curriculum_lessons
  for all using (
    exists (
      select 1 from public.curriculum_items ci
      join public.classes c on ci.class_id = c.id
      where ci.id = curriculum_item_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.curriculum_items ci
      join public.classes c on ci.class_id = c.id
      where ci.id = curriculum_item_id and c.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage assessments for owned classes" on public.assessments
  for all using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage submissions for owned classes" on public.assessment_submissions
  for all using (
    exists (
      select 1 from public.assessments a
      join public.classes c on a.class_id = c.id
      where a.id = assessment_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessments a
      join public.classes c on a.class_id = c.id
      where a.id = assessment_id and c.owner_id = auth.uid()
    )
  );

create policy if not exists "Manage grades for owned classes" on public.assessment_grades
  for all using (
    exists (
      select 1 from public.assessments a
      join public.classes c on a.class_id = c.id
      where a.id = assessment_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessments a
      join public.classes c on a.class_id = c.id
      where a.id = assessment_id and c.owner_id = auth.uid()
    )
  );
