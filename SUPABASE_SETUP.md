# Supabase Integration Setup Guide

## Overview
This project uses Supabase for backend functionality including authentication, user profiles, and class enrollment management.

## Configuration

### Environment Variables
The Supabase client is already configured with the following credentials:
- **Project ID**: `ruybexkjupmannggnstn`
- **URL**: `https://ruybexkjupmannggnstn.supabase.co`
- **Anon Key**: Already configured in `src/integrations/supabase/client.ts`

Serverless API routes (e.g. `netlify/functions/lesson-plans.ts` and
`netlify/functions/lesson-plan-pdf.ts`) require a **Service Role Key** to bypass
row-level security when running outside of the browser. Add the following to
your deployment or local `.env` file when invoking the functions directly:

```
SUPABASE_URL=https://ruybexkjupmannggnstn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key from Supabase project settings>
LESSON_PLAN_PDF_BUCKET=lesson-plan-pdfs # optional, defaults to this value
```

> ℹ️ The automated tests use mocked Supabase clients so no additional variables
> are required to run `npm run test` locally.

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

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view/modify their own data
- Classes are publicly viewable but only instructors can modify

## Features Implemented

### Authentication
- Email/password authentication