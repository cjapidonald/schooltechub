-- Add a foreign key for lesson_plans.class_id once classes table is available
DO $$
BEGIN
  IF to_regclass('public.lesson_plans') IS NOT NULL
     AND to_regclass('public.classes') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'lesson_plans_class_id_fkey'
         AND conrelid = 'public.lesson_plans'::regclass
     ) THEN
    EXECUTE 'ALTER TABLE public.lesson_plans
             ADD CONSTRAINT lesson_plans_class_id_fkey
             FOREIGN KEY (class_id)
             REFERENCES public.classes(id)';
  END IF;
END $$;
