create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_id);

create index if not exists idx_audit_logs_action
  on public.audit_logs (action);

create index if not exists idx_audit_logs_target
  on public.audit_logs (target_type, target_id);

alter table public.audit_logs enable row level security;

create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can write audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_admin());
