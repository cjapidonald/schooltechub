-- Notification templates for approval emails and other system messages
create table if not exists public.notification_templates (
  type text primary key,
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

-- Track when templates are updated
drop trigger if exists notification_templates_set_updated_at on public.notification_templates;
create trigger notification_templates_set_updated_at
  before update on public.notification_templates
  for each row
  execute function public.set_updated_at();

-- Site wide feature toggles and runtime flags
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync for site settings
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

-- RLS policies restricting access to admins and service role callers
alter table public.notification_templates enable row level security;
alter table public.site_settings enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Notification templates accessible to admins'
      AND tablename = 'notification_templates'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Notification templates accessible to admins"
      ON public.notification_templates
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Notification templates manageable by admins'
      AND tablename = 'notification_templates'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Notification templates manageable by admins"
      ON public.notification_templates
      FOR ALL
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Site settings accessible to admins'
      AND tablename = 'site_settings'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Site settings accessible to admins"
      ON public.site_settings
      FOR SELECT
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Site settings manageable by admins'
      AND tablename = 'site_settings'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Site settings manageable by admins"
      ON public.site_settings
      FOR ALL
      USING (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      )
      WITH CHECK (
        coalesce(auth.jwt() ->> 'role', '') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;
END $$;
