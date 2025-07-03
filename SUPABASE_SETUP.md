# Supabase Setup Guide

## 1. Create Supabase Account & Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `client-perception-survey`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. Once your project is created, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGci...`)

## 3. Update Environment Variables

1. Open `.env` in your project root
2. Replace the placeholder values:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## 4. Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

## 5. Verify Setup

1. Tables should appear in **Table Editor**:
   - `survey_sessions`
   - `survey_responses`
   - `survey_analytics` (view)

2. You should see the following policies under **Authentication** → **Policies**:
   - Public access policies for both tables

## 6. Test the Integration

1. Restart your development server: `npm start`
2. Take the survey and rate a few items
3. Check Supabase **Table Editor** → **survey_responses** to see your data

## 7. For Production (Netlify Deployment)

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add the same environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

## Features Enabled

✅ **Multi-user support** - Each user gets unique ID
✅ **Real-time data persistence** - Responses saved to cloud
✅ **Session tracking** - Track when surveys started/completed
✅ **Fallback to localStorage** - Works offline
✅ **Analytics ready** - Built-in analytics view
✅ **CSV export** - Download responses with timestamps
✅ **Row-level security** - Data is secure but publicly accessible for survey

## Monitoring Responses

- View all responses in **Table Editor** → **survey_responses**
- See completion rates in **Table Editor** → **survey_sessions**
- Use the **survey_analytics** view for aggregated data
- Export data as CSV directly from Supabase dashboard

## Security Notes

- The survey is configured for public access (anyone can submit)
- Each user gets a unique ID stored in their browser
- No personal information is collected by default
- All data is stored securely in Supabase's PostgreSQL database