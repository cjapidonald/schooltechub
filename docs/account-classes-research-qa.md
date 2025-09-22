# Account, Classes, and Research QA Checklist

## Auth Gates
- Dashboard requires login.
- Research detail page requires login.

## Lesson Builder
- Date picker is visible.
- "Save to Class" links the selected lesson plan.
- Exports complete successfully.

## Classes
- Classes can be created and listed.
- Lesson plans can be attached to and unlinked from classes.
- Class counts display the correct values.

## Lesson Plans Tab
- Preview, export, and attach actions work.
- Deleting a plan respects row-level security (RLS).

## Notifications
- Notifications appear when plans are approved.
- Email notifications obey user preferences.
- Marking notifications as read works.

## Saved Posts
- Saving and removing posts works and the list updates accordingly.

## Research
- Research list shows public items.
- Applying sets status to pending.
- After admin approval, participant documents are downloadable.
- Submissions can be uploaded and their statuses are visible.

## Storage
- All files remain private.
- Only signed URLs allow downloads for authorized users.

## RLS Spot Checks
- Non-owners cannot see others’ lesson plans or classes.
- Non-participants cannot see research documents.
