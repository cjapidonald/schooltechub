# Admin QA Checklist

## Access Control
- Verify that a non-admin user receives a 404 response when visiting `/admin`.
- Confirm that an admin user can access `/admin` and that multi-factor authentication (MFA) is required and succeeds.

## Approvals Workflow
- Perform an approval action and ensure the target item's status updates appropriately.
- Confirm that the approval triggers user notifications.
- Check that each approval action is recorded in the audit log.

## User Management Operations
- Invite a user and confirm the invitation email is sent and the user appears in the system with the expected status.
- Trigger a password reset email for an existing user and verify receipt instead of manually changing the password.
- Disable a user account and ensure the user can no longer sign in and that the audit log captures the change.
- Delete a user and confirm removal from active listings with a corresponding audit log entry.

## Researcher Flow
- Create a project, upload required documentation, approve an applicant, and ensure the resulting participant can access the project's documents.

## Content Management
- Create, publish, soft-delete, and restore posts, verifying the expected visibility changes at each step.
- Create and approve resources, confirming they appear where expected.

## System Behavior
- Update an email template and verify that subsequent emails use the updated template content.

## Security & Compliance
- Ensure the `/admin` route is marked with `noindex` so it is excluded from search engine indexing.
- Confirm the `/admin` route does not appear in the sitemap.
- Verify that the Supabase service key is never exposed to clients and remains confined to serverless environments.
- Check that private storage buckets are only downloadable through signed URLs.

## Implementation Guardrails
- All admin-level actions must flow through server routes that call `is_admin()` and use the Supabase service role.
- Public or client-side code must rely solely on the Supabase anon key; never embed the service key client-side.
- Prefer sending password-reset emails rather than directly setting passwords during reset operations.
- Supabase Studio must not be embedded; rely on the custom Supabase-backed admin console instead.
