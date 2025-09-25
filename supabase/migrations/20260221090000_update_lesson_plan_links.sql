-- Ensure UUID extension available
create extension if not exists "uuid-ossp";

-- Create lesson_plans table if missing with required columns
create table if not exists public.lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users (id),
  title text not null,
  subject text,
  date date,
  objective text,
  success_criteria text,
  duration text,
  grouping text,
  delivery_mode text,
  logo_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure additional metadata columns exist on lesson_plans
alter table public.lesson_plans
  add column if not exists subject text,
  add column if not exists date date,
  add column if not exists objective text,
  add column if not exists success_criteria text;

-- Guarantee title is populated before setting NOT NULL
update public.lesson_plans
set title = coalesce(nullif(title, ''), 'Untitled Lesson Plan')
where title is null or title = '';

alter table public.lesson_plans
  alter column title set not null;

-- Maintain updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'lesson_plans_set_updated_at'
      AND tgrelid = 'public.lesson_plans'::regclass
  ) THEN
    CREATE TRIGGER lesson_plans_set_updated_at
      BEFORE UPDATE ON public.lesson_plans
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Create join table for linking lesson plans to classes
create table if not exists public.class_lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  added_by uuid references auth.users (id),
  added_at timestamptz not null default now(),
  unique (class_id, lesson_plan_id)
);

create index if not exists idx_class_lesson_plans_class on public.class_lesson_plans (class_id);
create index if not exists idx_class_lesson_plans_plan on public.class_lesson_plans (lesson_plan_id);

-- Enable row level security
alter table public.lesson_plans enable row level security;
alter table public.class_lesson_plans enable row level security;

-- Refresh policies for lesson_plans
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lesson plans are viewable by owners and linked classes" ON public.lesson_plans;
  DROP POLICY IF EXISTS "Lesson plan owners insert" ON public.lesson_plans;
  DROP POLICY IF EXISTS "Lesson plan owners update" ON public.lesson_plans;
  DROP POLICY IF EXISTS "Lesson plan owners delete" ON public.lesson_plans;

  CREATE POLICY "Lesson plans are viewable by owners and linked classes"
    ON public.lesson_plans
    FOR SELECT
    USING (
      owner_id = auth.uid()
      OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.class_lesson_plans clp
        JOIN public.classes c ON c.id = clp.class_id
        WHERE clp.lesson_plan_id = public.lesson_plans.id
          AND (
            c.owner_id = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM public.class_members cm
              WHERE cm.class_id = c.id
                AND cm.user_id = auth.uid()
            )
          )
      )
    );

  CREATE POLICY "Lesson plan owners insert"
    ON public.lesson_plans
    FOR INSERT TO authenticated
    WITH CHECK (
      owner_id = auth.uid()
      OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
    );

  CREATE POLICY "Lesson plan owners update"
    ON public.lesson_plans
    FOR UPDATE TO authenticated
    USING (
      owner_id = auth.uid()
      OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
    )
    WITH CHECK (
      owner_id = auth.uid()
      OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
    );

  CREATE POLICY "Lesson plan owners delete"
    ON public.lesson_plans
    FOR DELETE TO authenticated
    USING (
      owner_id = auth.uid()
      OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
    );
END $$;

-- Refresh policies for class_lesson_plans
DO $$
BEGIN
  DROP POLICY IF EXISTS "Class links visible to related users" ON public.class_lesson_plans;
  DROP POLICY IF EXISTS "Owners link lesson plans to classes" ON public.class_lesson_plans;

  CREATE POLICY "Class links visible to related users"
    ON public.class_lesson_plans
    FOR SELECT
    USING (
      coalesce(auth.jwt() ->> 'role', '') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = class_id
          AND (
            c.owner_id = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM public.class_members cm
              WHERE cm.class_id = c.id
                AND cm.user_id = auth.uid()
            )
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.lesson_plans lp
        WHERE lp.id = lesson_plan_id
          AND lp.owner_id = auth.uid()
      )
    );

  CREATE POLICY "Class owners manage lesson plan links"
    ON public.class_lesson_plans
    FOR ALL TO authenticated
    USING (
      coalesce(auth.jwt() ->> 'role', '') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = class_id
          AND c.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      coalesce(auth.jwt() ->> 'role', '') = 'admin'
      OR (
        EXISTS (
          SELECT 1
          FROM public.classes c
          WHERE c.id = class_id
            AND c.owner_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1
          FROM public.lesson_plans lp
          WHERE lp.id = lesson_plan_id
            AND lp.owner_id = auth.uid()
        )
      )
    );
END $$;

-- Seed sample data for testing linkage
DO $$
DECLARE
  sample_class_id uuid;
  sample_owner_id uuid;
  sample_plan_id uuid;
  sample_plan_two_id uuid;
BEGIN
  SELECT c.id, c.owner_id
  INTO sample_class_id, sample_owner_id
  FROM public.classes c
  ORDER BY c.created_at
  LIMIT 1;

  IF sample_class_id IS NULL THEN
    SELECT u.id
    INTO sample_owner_id
    FROM auth.users u
    ORDER BY u.created_at
    LIMIT 1;

    IF sample_owner_id IS NULL THEN
      RETURN;
    END IF;

    INSERT INTO public.classes (id, name, subject, owner_id)
    VALUES (
      coalesce(sample_class_id, uuid_generate_v4()),
      'Sample Class',
      'General Studies',
      sample_owner_id
    )
    ON CONFLICT (id) DO NOTHING;

    SELECT c.id, c.owner_id
    INTO sample_class_id, sample_owner_id
    FROM public.classes c
    ORDER BY c.created_at
    LIMIT 1;
  END IF;

  IF sample_class_id IS NULL OR sample_owner_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lesson_plans WHERE title = 'Sample Literacy Lesson'
  ) THEN
    INSERT INTO public.lesson_plans (owner_id, title, subject, date, objective, success_criteria)
    VALUES (
      sample_owner_id,
      'Sample Literacy Lesson',
      'Literacy',
      current_date + 1,
      'Introduce key vocabulary through interactive reading.',
      'Students can explain three new words in their own sentences.'
    )
    RETURNING id INTO sample_plan_id;
  ELSE
    SELECT id INTO sample_plan_id
    FROM public.lesson_plans
    WHERE title = 'Sample Literacy Lesson'
    LIMIT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lesson_plans WHERE title = 'Sample Numeracy Lesson'
  ) THEN
    INSERT INTO public.lesson_plans (owner_id, title, subject, date, objective, success_criteria)
    VALUES (
      sample_owner_id,
      'Sample Numeracy Lesson',
      'Mathematics',
      current_date + 2,
      'Build fluency with multiplication facts.',
      'Students solve at least five multiplication problems independently.'
    )
    RETURNING id INTO sample_plan_two_id;
  ELSE
    SELECT id INTO sample_plan_two_id
    FROM public.lesson_plans
    WHERE title = 'Sample Numeracy Lesson'
    LIMIT 1;
  END IF;

  IF sample_plan_id IS NOT NULL THEN
    INSERT INTO public.class_lesson_plans (class_id, lesson_plan_id, added_by)
    VALUES (sample_class_id, sample_plan_id, sample_owner_id)
    ON CONFLICT (class_id, lesson_plan_id) DO NOTHING;
  END IF;

  IF sample_plan_two_id IS NOT NULL THEN
    INSERT INTO public.class_lesson_plans (class_id, lesson_plan_id, added_by)
    VALUES (sample_class_id, sample_plan_two_id, sample_owner_id)
    ON CONFLICT (class_id, lesson_plan_id) DO NOTHING;
  END IF;
END $$;
