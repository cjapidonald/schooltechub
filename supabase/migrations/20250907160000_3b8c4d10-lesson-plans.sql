-- Create minimal lesson_plans table for builder metadata
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  subject text,
  class_id uuid,
  date date,
  school_name text,
  school_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure the updated_at column stays in sync on modifications
drop trigger if exists lesson_plans_set_updated_at on public.lesson_plans;

create trigger lesson_plans_set_updated_at
  before update on public.lesson_plans
  for each row
  execute function public.update_updated_at_column();

-- Restrict access to lesson plans so only owners can manage their content
alter table public.lesson_plans enable row level security;

create policy if not exists "Lesson plan owners can select"
  on public.lesson_plans
  for select
  to authenticated
  using (auth.uid() = owner_id);

create policy if not exists "Lesson plan owners can insert"
  on public.lesson_plans
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy if not exists "Lesson plan owners can update"
  on public.lesson_plans
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy if not exists "Lesson plan owners can delete"
  on public.lesson_plans
  for delete
  to authenticated
  using (auth.uid() = owner_id);
