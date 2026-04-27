# Supabase Setup Guide

## 1. Create a Supabase project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Fill in the name (e.g. `family-health`), choose a region, set a database password
4. Click **Create new project** and wait ~2 minutes

## 2. Copy your API keys

1. In your project, go to **Settings → API**
2. Copy the **Project URL** → paste into `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
3. Copy the **anon / public** key → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role** key → paste into `SUPABASE_SERVICE_ROLE_KEY`

## 3. Run the database migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**

This creates all tables and Row-Level Security policies.

## 4. Configure Auth

1. Go to **Authentication → Settings**
2. Under **Site URL**, set it to `http://localhost:3000` (for development)
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`
4. Email confirmation is on by default. You can turn it off for development.

## 5. Create a Storage bucket (for documents)

1. Go to **Storage**
2. Click **New bucket**
3. Name it `medical-documents`
4. Keep it **private** (not public)
5. Add a policy: allow read/insert for authenticated users in their family

## 6. Start the dev server

```bash
npm run dev
```

Visit http://localhost:3000, sign up, create your family, and start adding members!
