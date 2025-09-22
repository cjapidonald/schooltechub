-- Update RLS policies to lock down classes, lesson plans, and research tables

-- Drop existing policies that are superseded by this migration
DROP POLICY IF EXISTS "Classes are viewable by owners and members" ON public.classes;
DROP POLICY IF EXISTS "Class owners insert classes" ON public.classes;
DROP POLICY IF EXISTS "Class owners manage classes" ON public.classes;
DROP POLICY IF EXISTS "Class owners delete classes" ON public.classes;

DROP POLICY IF EXISTS "Members view class memberships" ON public.class_members;
DROP POLICY IF EXISTS "Owners manage class memberships" ON public.class_members;

DROP POLICY IF EXISTS "Lesson plans are viewable by owners and linked classes" ON public.lesson_plans;
DROP POLICY IF EXISTS "Lesson plan owners insert" ON public.lesson_plans;
DROP POLICY IF EXISTS "Lesson plan owners update" ON public.lesson_plans;
DROP POLICY IF EXISTS "Lesson plan owners delete" ON public.lesson_plans;

DROP POLICY IF EXISTS "Lesson plan steps follow plan access" ON public.lesson_plan_steps;
DROP POLICY IF EXISTS "Lesson plan owners manage steps" ON public.lesson_plan_steps;

DROP POLICY IF EXISTS "Class links visible to related users" ON public.class_lesson_plans;
DROP POLICY IF EXISTS "Owners link lesson plans to classes" ON public.class_lesson_plans;

DROP POLICY IF EXISTS "Saved posts owned by user" ON public.saved_posts;

DROP POLICY IF EXISTS "Notifications visible to owners" ON public.notifications;
DROP POLICY IF EXISTS "Notifications can be inserted by system or owner" ON public.notifications;
DROP POLICY IF EXISTS "Notifications manageable by owners" ON public.notifications;
DROP POLICY IF EXISTS "Notifications deletable by owners" ON public.notifications;

DROP POLICY IF EXISTS "Notification prefs owned by user" ON public.notification_prefs;

DROP POLICY IF EXISTS "Research projects visibility" ON public.research_projects;
DROP POLICY IF EXISTS "Research projects insert by owner" ON public.research_projects;
DROP POLICY IF EXISTS "Research projects managed by owner" ON public.research_projects;

DROP POLICY IF EXISTS "Research documents access" ON public.research_documents;
DROP POLICY IF EXISTS "Research documents managed by owner" ON public.research_documents;

DROP POLICY IF EXISTS "Research applications readable by stakeholders" ON public.research_applications;
DROP POLICY IF EXISTS "Research applications insert by applicant" ON public.research_applications;
DROP POLICY IF EXISTS "Research applications managed by owners" ON public.research_applications;

DROP POLICY IF EXISTS "Research participants readable" ON public.research_participants;
DROP POLICY IF EXISTS "Research participants insert by owner" ON public.research_participants;
DROP POLICY IF EXISTS "Research participants update by owner" ON public.research_participants;
DROP POLICY IF EXISTS "Research participants deletable by owner or self" ON public.research_participants;

DROP POLICY IF EXISTS "Research submissions visibility" ON public.research_submissions;
DROP POLICY IF EXISTS "Research submissions insert by participants" ON public.research_submissions;
DROP POLICY IF EXISTS "Research submissions update by owner or participant" ON public.research_submissions;
DROP POLICY IF EXISTS "Research submissions deletable by owner or participant" ON public.research_submissions;

-- Classes policies
CREATE POLICY "Class owners can view"
  ON public.classes
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Class owners can insert"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Class owners can update"
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Class owners can delete"
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Class members can view classes"
  ON public.classes
  FOR SELECT
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.class_members cm
      WHERE cm.class_id = public.classes.id
        AND cm.user_id = auth.uid()
    )
  );

-- Class member policies
CREATE POLICY "Class members view own rows"
  ON public.class_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Class owners view memberships"
  ON public.class_members
  FOR SELECT
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Class owners manage memberships"
  ON public.class_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Class owners update memberships"
  ON public.class_members
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Class owners delete memberships"
  ON public.class_members
  FOR DELETE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

-- Lesson plan policies
CREATE POLICY "Lesson plan owners and linked classes can view"
  ON public.lesson_plans
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
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

CREATE POLICY "Lesson plan owners can insert"
  ON public.lesson_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Lesson plan owners can update"
  ON public.lesson_plans
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Lesson plan owners can delete"
  ON public.lesson_plans
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Lesson plan steps
CREATE POLICY "Lesson plan steps follow plan visibility"
  ON public.lesson_plan_steps
  FOR SELECT
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = lesson_plan_id
        AND (
          lp.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.class_lesson_plans clp
            JOIN public.classes c ON c.id = clp.class_id
            WHERE clp.lesson_plan_id = lp.id
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
        )
    )
  );

CREATE POLICY "Lesson plan owners manage steps"
  ON public.lesson_plan_steps
  FOR ALL
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = lesson_plan_id
        AND lp.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.lesson_plans lp
      WHERE lp.id = lesson_plan_id
        AND lp.owner_id = auth.uid()
    )
  );

-- Class to lesson plan links
CREATE POLICY "Class lesson links visible to class readers"
  ON public.class_lesson_plans
  FOR SELECT
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
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
  );

CREATE POLICY "Class owners manage lesson links"
  ON public.class_lesson_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Class owners update lesson links"
  ON public.class_lesson_plans
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Class owners delete lesson links"
  ON public.class_lesson_plans
  FOR DELETE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_id
        AND c.owner_id = auth.uid()
    )
  );

-- Saved posts
CREATE POLICY "Saved posts owner access"
  ON public.saved_posts
  FOR ALL
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Notifications and preferences
CREATE POLICY "Notifications readable by owner"
  ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notifications inserted by system"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Notifications updatable by owner"
  ON public.notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notifications deletable by owner"
  ON public.notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notification prefs readable"
  ON public.notification_prefs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notification prefs inserted by owner"
  ON public.notification_prefs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notification prefs updatable"
  ON public.notification_prefs
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Notification prefs deletable"
  ON public.notification_prefs
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Research projects
CREATE POLICY "Research projects public listing"
  ON public.research_projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Research projects owner insert"
  ON public.research_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research projects owner manage"
  ON public.research_projects
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    created_by = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research projects deletable by owner"
  ON public.research_projects
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Research documents
CREATE POLICY "Research documents visible to participants"
  ON public.research_documents
  FOR SELECT
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_participants rp
      WHERE rp.project_id = public.research_documents.project_id
        AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Research documents managed by admin"
  ON public.research_documents
  FOR ALL
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Research applications
CREATE POLICY "Research applications readable"
  ON public.research_applications
  FOR SELECT
  USING (
    applicant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research applications insert"
  ON public.research_applications
  FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research applications update status"
  ON public.research_applications
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research applications delete"
  ON public.research_applications
  FOR DELETE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Research participants
CREATE POLICY "Research participants readable"
  ON public.research_participants
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_projects rp
      WHERE rp.id = project_id
        AND rp.created_by = auth.uid()
    )
  );

CREATE POLICY "Research participants insert"
  ON public.research_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research participants update"
  ON public.research_participants
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

CREATE POLICY "Research participants delete"
  ON public.research_participants
  FOR DELETE
  TO authenticated
  USING (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
  );

-- Research submissions
CREATE POLICY "Research submissions readable"
  ON public.research_submissions
  FOR SELECT
  USING (
    participant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_projects rp
      WHERE rp.id = project_id
        AND rp.created_by = auth.uid()
    )
  );

CREATE POLICY "Research submissions insert"
  ON public.research_submissions
  FOR INSERT
  WITH CHECK (
    coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR (
      participant_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.research_participants rp
        WHERE rp.project_id = project_id
          AND rp.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Research submissions update"
  ON public.research_submissions
  FOR UPDATE
  TO authenticated
  USING (
    participant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_projects rp
      WHERE rp.id = project_id
        AND rp.created_by = auth.uid()
    )
  )
  WITH CHECK (
    participant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_projects rp
      WHERE rp.id = project_id
        AND rp.created_by = auth.uid()
    )
  );

CREATE POLICY "Research submissions delete"
  ON public.research_submissions
  FOR DELETE
  TO authenticated
  USING (
    participant_id = auth.uid()
    OR coalesce(request.jwt() ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.research_projects rp
      WHERE rp.id = project_id
        AND rp.created_by = auth.uid()
    )
  );
