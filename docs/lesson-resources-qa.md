# Lesson Resources QA Checklist

## Database Row-Level Security (RLS)
- [ ] Confirm the `anon` role can read published lesson resources (e.g., fetch `/resources` without an authenticated session and verify data is returned).
- [ ] Attempt to create a resource while authenticated as a non-owner user and ensure the request is rejected by the API/database.
- [ ] Attempt to update an existing resource owned by another user and confirm the change is rejected.
- [ ] Create and edit a resource as the owner and verify the operations succeed.

## Modal Search vs. `/resources`
- [ ] Apply identical filters (e.g., subject, grade, tags) in the resources modal search and on the `/resources` page.
- [ ] Verify that both views return the same set of items in the same order for matching filters.
- [ ] Confirm pagination, if present, aligns between the modal and `/resources`.

## Preview Visibility Rules
- [ ] Review the preview panel for a resource that has missing optional fields and confirm empty fields/sections are hidden.
- [ ] Verify that when optional data is added, the preview updates to show the new sections.

## Step Management
- [ ] Open a draft lesson and add a new step; ensure the default title is present and immediately editable.
- [ ] Edit the default step title and confirm the change persists.
- [ ] Add multiple steps and verify they appear in the correct order.
- [ ] Remove a step and ensure it disappears from both the editor and preview.

## Resource Addition via Plus Button
- [ ] While a draft lesson is active, add a resource using the modal’s plus button and confirm it attaches to the draft.
- [ ] Add a resource from the `/resources` page using the plus button and verify it attaches to the same active draft.
- [ ] Ensure the draft reflects resources added from both entry points without duplicates.

## Mobile Experience
- [ ] On a mobile viewport (≤ 768px), confirm the preview panel collapses/expands as designed.
- [ ] Verify the modal content is scrollable and the search results remain accessible.
- [ ] Check that all primary controls (save, publish, plus button, modal actions) are reachable and usable without horizontal scrolling.

## Completion
- [ ] All sections above have been validated and issues tracked or resolved.
- [ ] QA sign-off recorded with date and tester initials.
