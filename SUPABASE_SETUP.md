# Supabase Integration Setup Guide

## Overview
This project uses Supabase for backend functionality including authentication, user profiles, and class enrollment management.

## Configuration

### Environment Variables
The Supabase client is already configured with the following credentials:
- **Project ID**: `ruybexkjupmannggnstn`
- **URL**: `https://ruybexkjupmannggnstn.supabase.co`
- **Anon Key**: Already configured in `src/integrations/supabase/client.ts`

> **Service role access:** Administrative scripts that seed or moderate lesson plans should run with the Supabase service role key. Store it as `SUPABASE_SERVICE_ROLE_KEY` in server-side environments only.

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

5. **Builder tables** - Lesson plan authoring workspace
   - **activities** – reusable learning experiences with stage, delivery mode, technology, and resource metadata
   - **lesson_plans** – normalized lesson plans with owner IDs, share codes, overview JSON, and searchable tags
   - **lesson_plan_sections**/**lesson_plan_steps** – ordered structure for plan sections and individual steps
   - **standards**/**lesson_plan_standards** – catalog of standards with plan alignment mappings
   - **plan_versions** – immutable JSON snapshots for change history and collaboration
   - Supporting indexes: GIN indexes on all array columns plus trigram indexes on URL domains for quick lookup

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view/modify their own data
- Classes are publicly viewable but only instructors can modify
- Discovery lesson plans remain publicly readable only when `status = 'published'`
- Builder tables ship with layered policies:
  - **Owner manage** – authenticated owners (or the service role) can insert/update/delete their activities, plans, steps, and versions
  - **Shared access** – collaborators listed in the `shared_with` array or requests presenting a matching `builder_share_code` JWT claim can read shared drafts
  - **Published read** – builder lesson plans marked `published` remain readable by anonymous clients for the public catalogue
  - Standards are world-readable; authoring is reserved for the service role or the creating user

#### Required Extensions
- `pgcrypto` – provides `gen_random_uuid()` for primary keys and share codes
- `uuid-ossp` – enables `uuid_nil()` used during legacy data backfill
- `pg_trgm` – powers trigram GIN indexes on resource URL domains for fast lookups

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