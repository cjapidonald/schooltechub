-- Strengthen admin authentication requirements and add rate limiting

-- Extend profiles with MFA tracking and soft-delete support
alter table public.profiles
  add column if not exists mfa_verified_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_profiles_deleted_at
  on public.profiles(deleted_at);

-- Allow administrators to see deleted profiles while hiding them from the public
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Active profiles are viewable by everyone"
  on public.profiles
  for select
  using (deleted_at is null);

create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own active profile"
  on public.profiles
  for update
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id and deleted_at is null);

create policy "Admins can manage profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Soft-delete admin role assignments instead of removing records
alter table public.app_admins
  add column if not exists deleted_at timestamptz;

create index if not exists idx_app_admins_active
  on public.app_admins(user_id)
  where deleted_at is null;

update public.app_admins
set deleted_at = null
where deleted_at is distinct from null;

-- Refresh helper to respect soft-deleted assignments
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
      and a.deleted_at is null
  );
end;
$$;

comment on function public.is_admin is 'Returns true when the provided (or current) user is registered as an application administrator and the assignment has not been revoked.';

-- Add a lightweight rate limit store for admin API usage
create table if not exists public.admin_rate_limits (
  user_id uuid not null,
  route text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  constraint admin_rate_limits_pkey primary key (user_id, route)
);

create index if not exists idx_admin_rate_limits_window
  on public.admin_rate_limits(window_start);

create or replace function public.enforce_admin_rate_limit(
  p_user_id uuid,
  p_route text,
  p_limit integer default 30,
  p_window_seconds integer default 60
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => greatest(p_window_seconds, 1));
  v_window_start timestamptz;
  v_count integer;
begin
  if p_user_id is null or p_route is null or length(trim(p_route)) = 0 then
    return false;
  end if;

  insert into public.admin_rate_limits as ar (user_id, route, window_start, request_count)
  values (p_user_id, p_route, v_now, 1)
  on conflict (user_id, route) do update
    set window_start = case when ar.window_start < v_now - v_window then v_now else ar.window_start end,
        request_count = case when ar.window_start < v_now - v_window then 1 else ar.request_count + 1 end
  returning window_start, request_count
    into v_window_start, v_count;

  if v_window_start >= v_now - v_window and v_count > p_limit then
    return false;
  end if;

  return true;
end;
$$;

comment on function public.enforce_admin_rate_limit is 'Returns true when the requesting admin is within the configured rate limit window while incrementing their usage counter.';
