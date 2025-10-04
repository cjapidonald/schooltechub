# Supabase Integration Setup Guide

## Overview
This project uses Supabase for backend functionality including authentication, user profiles, and class enrollment management.

## Configuration

### Environment Variables
The Supabase client is already configured with the following credentials:
- **Project ID**: `ruybexkjupmannggnstn`
- **URL**: `https://ruybexkjupmannggnstn.supabase.co`
- **Anon Key**: Already configured in `src/integrations/supabase/client.ts`
- **Service Role Key**: Required for all serverless API routes. Store it as `SUPABASE_SERVICE_ROLE_KEY` in Netlify/Render/Node server environments and in a local `.env` file for development.

> **Service role access:** Administrative scripts that seed or moderate lesson plans must run with the Supabase service role key. Retrieve it from **Project Settings → API → Service Role secret** and never expose it to client-side code. The serverless API will now throw an error at startup if the key is missing so deployments fail fast when misconfigured.

### Database Schema

#### Tables Created
1. **profiles** - Stores user profile information
   - Synced with auth.users via trigger
   - Contains: full_name, email, role

2. **classes** - Course/class information
   - Fields: title, description, instructor, schedule, capacity, status
   - Statuses: active, completed, upcoming, archived

3. **enrollments** - Tracks user enrollments in classes
   - Links users to classes they're enrolled in
   - Tracks progress, status, and notes
   - Statuses: enrolled, completed, dropped, pending

4. **lesson_plans** - Curriculum-ready lesson outlines for discovery
   - Fields: title, summary, subject, grade levels, objectives, materials, activities, standards, status
   - Search: generated `search_vector` column backed by GIN indexes for fast keyword lookups
   - Access: defaults to `draft`; only `status = 'published'` rows are exposed through public RLS policies

5. **students** - Individual learner records owned by a teacher
   - Fields: first_name, last_name, preferred_name, email, avatar_url, owner_id
   - Policies: only the owning teacher (owner_id) can view or modify rows

6. **class_students** - Enrollment join table between classes and students
   - Enforces unique (class_id, student_id) pairs
   - Policies: restricted to classes owned by the authenticated teacher

7. **student_behavior_logs** & **student_appraisals** - Narrative notes about behaviour and achievements
   - Behaviour entries store sentiment (positive, neutral, needs_support)
   - Appraisals capture highlights used for AI progress reports

8. **student_reports** - Audit trail of AI-generated progress report requests
   - Tracks status (`pending`, `processing`, `ready`, `failed`) plus generated URLs

9. **curriculum_items** & **curriculum_lessons** - Store scoped curriculum rows and links to lesson plans
   - Support filters for stage, subject, week, and scheduled date in the dashboard

10. **assessments**, **assessment_submissions**, **assessment_grades** - Assessment tracking stack
    - Templates capture description, grading scale, and due date
    - Submissions record student status/attachments
    - Grades capture teacher feedback with flexible scales (letter, percentage, points, rubric)

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view/modify their own data
- Classes are publicly viewable but only instructors can modify
- Lesson plans are publicly readable only when `status = 'published'`; use a service role key for inserts, updates, or moderation tasks.

## Features Implemented

### Authentication
- Email/password authentication
- Google OAuth support
- Protected routes with automatic redirects
- Session persistence

### User Dashboard
- Profile management with avatar upload
- Notification preferences
- Activity tracking (comments, posts)
- Security settings (password change)

### Class Enrollment System
- Browse available classes
- Enroll/drop classes
- Track progress
- Add personal notes
- View enrollment history

## Usage

### For Users
1. Sign up/Login via `/auth` page
2. Access dashboard at `/account`
3. Navigate to "Classes" tab to:
   - View enrolled classes
   - Browse available classes
   - Manage enrollments

### For Developers

#### Accessing Supabase Client
```typescript
import { supabase } from "@/integrations/supabase/client";
```

#### Using the Enrollments Hook
```typescript
import { useEnrollments } from "@/hooks/useEnrollments";

const { 
  enrollments, 
  availableClasses,
  enrollInClass,
  dropEnrollment 
} = useEnrollments(userId);
```

## Deployment

### Required Supabase Settings
1. **Authentication > URL Configuration**:
   - Site URL: Your production URL
   - Redirect URLs: Add all environment URLs

2. **Email Templates**: 
   - Consider disabling "Confirm email" for faster testing

3. **Storage Buckets**:
   - `profile-images` bucket for avatars (if not exists, create it)

## Security Notes
- RLS policies protect user data
- Authentication required for dashboard access
- Profile data synced with auth system
- Enrollment counts automatically managed via triggers

## Troubleshooting
- If users can't see data: Check RLS policies
- Authentication errors: Verify redirect URLs in Supabase
- Profile sync issues: Check the handle_new_user trigger

## Links
- [Supabase Dashboard](https://supabase.com/dashboard/project/ruybexkjupmannggnstn)
- [Authentication Settings](https://supabase.com/dashboard/project/ruybexkjupmannggnstn/auth/providers)
- [Database Tables](https://supabase.com/dashboard/project/ruybexkjupmannggnstn/editor)