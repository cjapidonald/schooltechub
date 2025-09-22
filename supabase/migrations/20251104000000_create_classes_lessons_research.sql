-- Ensure UUID extension exists for primary keys
create extension if not exists "uuid-ossp";

-- Classes represent teaching groups owned by an educator
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text,
  stage text,
  owner_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_classes_owner on public.classes (owner_id);

-- Optional co-teachers / assistants for a class
create table if not exists public.class_members (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  role text not null default 'teacher' check (role in ('owner','teacher','assistant')),
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create index if not exists idx_class_members_class_id on public.class_members (class_id);
create index if not exists idx_class_members_user_id on public.class_members (user_id);

-- Lesson plans authored by educators
create table if not exists public.lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users (id),
  title text,
  date date,
  duration text,
  grouping text,
  delivery_mode text,
  logo_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lesson_plans_owner on public.lesson_plans (owner_id);

-- Steps for a lesson plan
create table if not exists public.lesson_plan_steps (
  id uuid primary key default uuid_generate_v4(),
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  position int,
  title text,
  notes text,
  resource_ids uuid[] not null default '{}'::uuid[]
);

create index if not exists idx_lesson_plan_steps_plan on public.lesson_plan_steps (lesson_plan_id);
create index if not exists idx_lesson_plan_steps_position on public.lesson_plan_steps (position);

-- Mapping lesson plans to the classes that will use them
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

-- Saved posts allow bookmarking blog content
create table if not exists public.saved_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id),
  post_id uuid not null,
  saved_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists idx_saved_posts_user on public.saved_posts (user_id);

-- Notifications delivered to users
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id),
  type text not null check (type in ('resource_approved','blogpost_approved','research_application_approved','comment_reply')),
  payload jsonb not null,
  is_read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_notifications_read on public.notifications (user_id, is_read);

-- Notification preferences
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id),
  email_enabled boolean not null default true,
  resource_approved boolean not null default true,
  blogpost_approved boolean not null default true,
  research_application_approved boolean not null default true,
  comment_reply boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Research projects catalogue
create table if not exists public.research_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique,
  summary text,
  status text not null default 'open' check (status in ('draft','open','closed')),
  visibility text not null default 'list_public' check (visibility in ('list_public','private')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_research_projects_creator on public.research_projects (created_by);
create index if not exists idx_research_projects_visibility on public.research_projects (visibility);

-- Documents associated with a research project stored privately
create table if not exists public.research_documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.research_projects (id) on delete cascade,
  title text,
  doc_type text check (doc_type in ('protocol','consent','dataset','report','misc')),
  storage_path text,
  status text not null default 'participant' check (status in ('internal','participant','public')),
  created_at timestamptz not null default now()
);

create index if not exists idx_research_documents_project on public.research_documents (project_id);
create index if not exists idx_research_documents_status on public.research_documents (status);

-- Applications submitted by educators to participate in research
create table if not exists public.research_applications (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.research_projects (id) on delete cascade,
  applicant_id uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  statement text,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id)
);

create index if not exists idx_research_applications_project on public.research_applications (project_id);
create index if not exists idx_research_applications_status_project on public.research_applications (status, project_id);

-- Participants granted access to the project after approval
create table if not exists public.research_participants (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.research_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists idx_research_participants_project on public.research_participants (project_id);
create index if not exists idx_research_participants_user on public.research_participants (user_id);
create index if not exists idx_research_participants_project_user on public.research_participants (project_id, user_id);

-- Submissions uploaded by participants while a project is active
create table if not exists public.research_submissions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.research_projects (id) on delete cascade,
  participant_id uuid not null references auth.users (id),
  title text,
  description text,
  storage_path text,
  status text not null default 'submitted' check (status in ('submitted','accepted','needs_changes')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz
);

create index if not exists idx_research_submissions_project on public.research_submissions (project_id);
create index if not exists idx_research_submissions_participant on public.research_submissions (participant_id);
create index if not exists idx_research_submissions_project_participant on public.research_submissions (project_id, participant_id);

-- Enable RLS for all new tables
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_steps enable row level security;
alter table public.class_lesson_plans enable row level security;
alter table public.saved_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.research_projects enable row level security;
alter table public.research_documents enable row level security;
alter table public.research_applications enable row level security;
alter table public.research_participants enable row level security;
alter table public.research_submissions enable row level security;

-- Maintain updated_at on lesson plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'lesson_plans_set_updated_at'
  ) THEN
    CREATE TRIGGER lesson_plans_set_updated_at
      BEFORE UPDATE ON public.lesson_plans
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Policies for classes and memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Classes are viewable by owners and members'
      AND schemaname = 'public' AND tablename = 'classes'
  ) THEN
    CREATE POLICY "Classes are viewable by owners and members"
      ON public.classes
      FOR SELECT
      USING (
        owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.class_members cm
          WHERE cm.class_id = id
            AND cm.user_id = auth.uid()
        )
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Class owners insert classes'
      AND schemaname = 'public' AND tablename = 'classes'
  ) THEN
    CREATE POLICY "Class owners insert classes"
      ON public.classes
      FOR INSERT TO authenticated
      WITH CHECK (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Class owners manage classes'
      AND schemaname = 'public' AND tablename = 'classes'
  ) THEN
    CREATE POLICY "Class owners manage classes"
      ON public.classes
      FOR UPDATE TO authenticated
      USING (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      )
      WITH CHECK (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Class owners delete classes'
      AND schemaname = 'public' AND tablename = 'classes'
  ) THEN
    CREATE POLICY "Class owners delete classes"
      ON public.classes
      FOR DELETE TO authenticated
      USING (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Members view class memberships'
      AND schemaname = 'public' AND tablename = 'class_members'
  ) THEN
    CREATE POLICY "Members view class memberships"
      ON public.class_members
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = class_id
            AND (
              c.owner_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.class_members cm
                WHERE cm.class_id = class_id
                  AND cm.user_id = auth.uid()
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners manage class memberships'
      AND schemaname = 'public' AND tablename = 'class_members'
  ) THEN
    CREATE POLICY "Owners manage class memberships"
      ON public.class_members
      FOR ALL TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = class_id
            AND c.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = class_id
            AND c.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies for lesson plans and steps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plans are viewable by owners and linked classes'
      AND schemaname = 'public' AND tablename = 'lesson_plans'
  ) THEN
    CREATE POLICY "Lesson plans are viewable by owners and linked classes"
      ON public.lesson_plans
      FOR SELECT
      USING (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.class_lesson_plans clp
          JOIN public.classes c ON c.id = clp.class_id
          WHERE clp.lesson_plan_id = public.lesson_plans.id
            AND (
              c.owner_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.class_members cm
                WHERE cm.class_id = c.id
                  AND cm.user_id = auth.uid()
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plan owners insert'
      AND schemaname = 'public' AND tablename = 'lesson_plans'
  ) THEN
    CREATE POLICY "Lesson plan owners insert"
      ON public.lesson_plans
      FOR INSERT TO authenticated
      WITH CHECK (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plan owners update'
      AND schemaname = 'public' AND tablename = 'lesson_plans'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plan owners delete'
      AND schemaname = 'public' AND tablename = 'lesson_plans'
  ) THEN
    CREATE POLICY "Lesson plan owners delete"
      ON public.lesson_plans
      FOR DELETE TO authenticated
      USING (
        owner_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plan steps follow plan access'
      AND schemaname = 'public' AND tablename = 'lesson_plan_steps'
  ) THEN
    CREATE POLICY "Lesson plan steps follow plan access"
      ON public.lesson_plan_steps
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.lesson_plans lp
          WHERE lp.id = lesson_plan_id
            AND (
              lp.owner_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.class_lesson_plans clp
                JOIN public.classes c ON c.id = clp.class_id
                WHERE clp.lesson_plan_id = lp.id
                  AND (
                    c.owner_id = auth.uid()
                    OR EXISTS (
                      SELECT 1 FROM public.class_members cm
                      WHERE cm.class_id = c.id
                        AND cm.user_id = auth.uid()
                    )
                  )
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Lesson plan owners manage steps'
      AND schemaname = 'public' AND tablename = 'lesson_plan_steps'
  ) THEN
    CREATE POLICY "Lesson plan owners manage steps"
      ON public.lesson_plan_steps
      FOR ALL TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.lesson_plans lp
          WHERE lp.id = lesson_plan_id
            AND lp.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.lesson_plans lp
          WHERE lp.id = lesson_plan_id
            AND lp.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Class links visible to related users'
      AND schemaname = 'public' AND tablename = 'class_lesson_plans'
  ) THEN
    CREATE POLICY "Class links visible to related users"
      ON public.class_lesson_plans
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = class_id
            AND (
              c.owner_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.class_members cm
                WHERE cm.class_id = c.id
                  AND cm.user_id = auth.uid()
              )
            )
        )
        OR EXISTS (
          SELECT 1 FROM public.lesson_plans lp
          WHERE lp.id = lesson_plan_id
            AND lp.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Owners link lesson plans to classes'
      AND schemaname = 'public' AND tablename = 'class_lesson_plans'
  ) THEN
    CREATE POLICY "Owners link lesson plans to classes"
      ON public.class_lesson_plans
      FOR ALL TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR (
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_id
              AND (
                c.owner_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM public.class_members cm
                  WHERE cm.class_id = c.id
                    AND cm.user_id = auth.uid()
                )
              )
          )
          AND EXISTS (
            SELECT 1 FROM public.lesson_plans lp
            WHERE lp.id = lesson_plan_id
              AND lp.owner_id = auth.uid()
          )
        )
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR (
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_id
              AND (
                c.owner_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM public.class_members cm
                  WHERE cm.class_id = c.id
                    AND cm.user_id = auth.uid()
                )
              )
          )
          AND EXISTS (
            SELECT 1 FROM public.lesson_plans lp
            WHERE lp.id = lesson_plan_id
              AND lp.owner_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Policies for saved posts and notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Saved posts owned by user'
      AND schemaname = 'public' AND tablename = 'saved_posts'
  ) THEN
    CREATE POLICY "Saved posts owned by user"
      ON public.saved_posts
      FOR ALL TO authenticated
      USING (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      )
      WITH CHECK (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Notifications visible to owners'
      AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Notifications visible to owners"
      ON public.notifications
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Notifications can be inserted by system or owner'
      AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Notifications can be inserted by system or owner"
      ON public.notifications
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Notifications manageable by owners'
      AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Notifications manageable by owners"
      ON public.notifications
      FOR UPDATE TO authenticated
      USING (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      )
      WITH CHECK (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Notifications deletable by owners'
      AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Notifications deletable by owners"
      ON public.notifications
      FOR DELETE TO authenticated
      USING (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Notification prefs owned by user'
      AND schemaname = 'public' AND tablename = 'notification_prefs'
  ) THEN
    CREATE POLICY "Notification prefs owned by user"
      ON public.notification_prefs
      FOR ALL TO authenticated
      USING (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      )
      WITH CHECK (
        user_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;
END $$;

-- Policies for research projects and related tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research projects visibility'
      AND schemaname = 'public' AND tablename = 'research_projects'
  ) THEN
    CREATE POLICY "Research projects visibility"
      ON public.research_projects
      FOR SELECT
      USING (
        visibility = 'list_public'
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_participants rp
          WHERE rp.project_id = id
            AND rp.user_id = auth.uid()
        )
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research projects insert by owner'
      AND schemaname = 'public' AND tablename = 'research_projects'
  ) THEN
    CREATE POLICY "Research projects insert by owner"
      ON public.research_projects
      FOR INSERT TO authenticated
      WITH CHECK (
        created_by = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research projects managed by owner'
      AND schemaname = 'public' AND tablename = 'research_projects'
  ) THEN
    CREATE POLICY "Research projects managed by owner"
      ON public.research_projects
      FOR ALL TO authenticated
      USING (
        created_by = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      )
      WITH CHECK (
        created_by = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research documents access'
      AND schemaname = 'public' AND tablename = 'research_documents'
  ) THEN
    CREATE POLICY "Research documents access"
      ON public.research_documents
      FOR SELECT
      USING (
        status = 'public'
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.research_participants rpart
          WHERE rpart.project_id = project_id
            AND rpart.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research documents managed by owner'
      AND schemaname = 'public' AND tablename = 'research_documents'
  ) THEN
    CREATE POLICY "Research documents managed by owner"
      ON public.research_documents
      FOR ALL TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research applications readable by stakeholders'
      AND schemaname = 'public' AND tablename = 'research_applications'
  ) THEN
    CREATE POLICY "Research applications readable by stakeholders"
      ON public.research_applications
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR applicant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research applications insert by applicant'
      AND schemaname = 'public' AND tablename = 'research_applications'
  ) THEN
    CREATE POLICY "Research applications insert by applicant"
      ON public.research_applications
      FOR INSERT TO authenticated
      WITH CHECK (
        applicant_id = auth.uid()
        OR coalesce(auth.jwt() ->> 'role', '') = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research applications manage by owner'
      AND schemaname = 'public' AND tablename = 'research_applications'
  ) THEN
    CREATE POLICY "Research applications manage by owner"
      ON public.research_applications
      FOR UPDATE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR applicant_id = auth.uid()
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR (applicant_id = auth.uid() AND status = 'pending')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research applications deletable by owner or applicant'
      AND schemaname = 'public' AND tablename = 'research_applications'
  ) THEN
    CREATE POLICY "Research applications deletable by owner or applicant"
      ON public.research_applications
      FOR DELETE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR applicant_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research participants visibility'
      AND schemaname = 'public' AND tablename = 'research_participants'
  ) THEN
    CREATE POLICY "Research participants visibility"
      ON public.research_participants
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research participants managed by owner'
      AND schemaname = 'public' AND tablename = 'research_participants'
  ) THEN
    CREATE POLICY "Research participants managed by owner"
      ON public.research_participants
      FOR INSERT TO authenticated
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research participants update by owner'
      AND schemaname = 'public' AND tablename = 'research_participants'
  ) THEN
    CREATE POLICY "Research participants update by owner"
      ON public.research_participants
      FOR UPDATE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research participants deletable by owner or self'
      AND schemaname = 'public' AND tablename = 'research_participants'
  ) THEN
    CREATE POLICY "Research participants deletable by owner or self"
      ON public.research_participants
      FOR DELETE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research submissions visibility'
      AND schemaname = 'public' AND tablename = 'research_submissions'
  ) THEN
    CREATE POLICY "Research submissions visibility"
      ON public.research_submissions
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR participant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research submissions insert by participants'
      AND schemaname = 'public' AND tablename = 'research_submissions'
  ) THEN
    CREATE POLICY "Research submissions insert by participants"
      ON public.research_submissions
      FOR INSERT TO authenticated
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR (
          participant_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM public.research_participants rp
            WHERE rp.project_id = project_id
              AND rp.user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research submissions update by owner or participant'
      AND schemaname = 'public' AND tablename = 'research_submissions'
  ) THEN
    CREATE POLICY "Research submissions update by owner or participant"
      ON public.research_submissions
      FOR UPDATE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR participant_id = auth.uid()
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
        OR (
          participant_id = auth.uid()
          AND status = 'submitted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Research submissions deletable by owner or participant'
      AND schemaname = 'public' AND tablename = 'research_submissions'
  ) THEN
    CREATE POLICY "Research submissions deletable by owner or participant"
      ON public.research_submissions
      FOR DELETE TO authenticated
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR participant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.research_projects rp
          WHERE rp.id = project_id
            AND rp.created_by = auth.uid()
        )
      );
  END IF;
END $$;
