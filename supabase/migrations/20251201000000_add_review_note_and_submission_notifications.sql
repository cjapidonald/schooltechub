-- Add optional review note for research submissions and extend notification support
alter table public.research_submissions
  add column if not exists review_note text;

-- Allow notifications for submission reviews
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
    check (
      type in (
        'resource_approved',
        'blogpost_approved',
        'research_application_approved',
        'comment_reply',
        'research_submission_reviewed'
      )
    );

-- Track preferences for submission review notifications
alter table public.notification_prefs
  add column if not exists research_submission_reviewed boolean not null default true;

update public.notification_prefs
  set research_submission_reviewed = coalesce(research_submission_reviewed, true);
