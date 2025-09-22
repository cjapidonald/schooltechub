-- Ensure an admin registry exists for permission checks
create table if not exists public.app_admins (
  user_id uuid primary key,
  granted_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Helper function to determine if the current or provided user is an admin
create or replace function public.is_admin(target_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_user uuid := coalesce(target_user_id, auth.uid());
begin
  if auth.role() = 'service_role' then
    return true;
  end if;

  if effective_user is null then
    return false;
  end if;

  return exists (
    select 1
    from public.app_admins a
    where a.user_id = effective_user
  );
end;
$$;

comment on function public.is_admin is 'Returns true when the provided (or current) user is registered as an application administrator.';

-- Strengthen the content master schema for editorial workflows
alter table public.content_master
  add column if not exists status text;

alter table public.content_master
  add column if not exists deleted_at timestamptz;

update public.content_master
set status = case
    when is_published then 'published'
    when status is null or status not in ('draft','pending','approved','published') then 'draft'
    else status
  end
where status is null
   or status not in ('draft','pending','approved','published')
   or (is_published = true and status <> 'published');

alter table public.content_master
  alter column status set default 'draft';

alter table public.content_master
  alter column status set not null;

alter table public.content_master
  add constraint if not exists content_master_status_check
  check (status in ('draft','pending','approved','published'));

create index if not exists idx_content_master_status
  on public.content_master(status);

create index if not exists idx_content_master_deleted_at
  on public.content_master(deleted_at);

create or replace function public.sync_content_master_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and new.deleted_at is null then
    new.is_published := true;
    if new.published_at is null then
      new.published_at := now();
    end if;
  else
    new.is_published := false;
  end if;

  if new.deleted_at is not null and new.status = 'published' then
    new.status := 'draft';
  end if;

  return new;
end;
$$;

drop trigger if exists content_master_sync_status on public.content_master;
create trigger content_master_sync_status
before insert or update on public.content_master
for each row
execute function public.sync_content_master_status();

-- Administrative policies for editorial content
drop policy if exists "Admins manage content" on public.content_master;
drop policy if exists "Admins read all content" on public.content_master;

create policy "Admins read all content"
  on public.content_master
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins manage content"
  on public.content_master
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Resource catalog enhancements
alter table public.resources
  add column if not exists updated_at timestamptz;

update public.resources
set updated_at = coalesce(updated_at, created_at);

alter table public.resources
  alter column updated_at set default now();

alter table public.resources
  alter column updated_at set not null;

create or replace function public.touch_resources_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.touch_resources_updated_at();

-- Refresh resource policies to leverage the shared admin helper
drop policy if exists "Admins can update any resource" on public.resources;
drop policy if exists "Admins can manage resources" on public.resources;
drop policy if exists "Admins can read resources" on public.resources;

create policy "Admins can read resources"
  on public.resources
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can manage resources"
  on public.resources
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
