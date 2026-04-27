# FamilyHealth

FamilyHealth is a shared family care workspace built with Next.js and Supabase. It combines a visual family tree with practical health tracking, so family members can understand relationships, monitor medical context, and coordinate appointments in one place.

The app is designed for families who need a simple way to track health information across generations. A parent, spouse, child, sibling, or care lead can add relatives, connect relationships, record conditions, mark hereditary risks, and keep appointments visible to everyone in the family workspace.

## What The App Does

- Creates a private family workspace after signup.
- Lets users add people to the family tree, including people who do not have their own login.
- Supports relationship management while creating or editing members.
- Renders an interactive family tree that groups parents, spouses, children, siblings, and unlinked members.
- Tracks member health conditions, hereditary markers, medications, allergies, appointments, and document references.
- Shows dashboard summary cards for members, appointments, conditions, and hereditary risks.
- Makes dashboard summary cards clickable, so users can jump directly into the related details.
- Supports email authentication and Google OAuth through Supabase Auth.
- Protects family data with Supabase Row Level Security policies.

## Core User Flows

### Signup And Family Creation

1. A user signs up with email or Google.
2. The app checks whether the user belongs to a family.
3. If they do not have a family yet, they are sent to Settings to create or join one.
4. The database function `create_family(family_name text)` creates the family and adds the current user as an admin member.

### Member Management

Family members are represented as `persons` records. A `person` can be linked to an auth user, but does not have to be. This allows a family to add children, elders, and other relatives who are tracked by someone else.

Users can create and edit:

- Name
- Date of birth
- Gender
- Notes
- Relationship to another family member

Relationship options include:

- Parent of
- Child of
- Spouse of
- Sibling of

The relationship helper writes the correct `relationships` rows so the tree can draw the family structure.

### Family Tree

The Family Tree page reads all family members and relationship records for the current family. It builds a `react-d3-tree` structure and displays:

- Profile cards for every person
- Parent and child links
- Spouse and sibling context
- Health condition counts
- Hereditary marker counts
- Appointment and medication indicators

If a person is not connected to anyone yet, the tree still shows them under an unlinked family group so they are not hidden.

### Dashboard

The dashboard gives a quick operating view of the family:

- Members count links to `/members`
- Upcoming appointment count links to `/appointments`
- Conditions count links to `/members?health=conditions`
- Hereditary count links to `/members?health=hereditary`
- The Open tree action links to `/tree`

The filtered member views help the user quickly find the family members who need attention.

## Tech Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- `@supabase/ssr` for server side auth cookies
- `react-d3-tree` for the interactive tree
- `react-hook-form` and `zod` for forms and validation
- `lucide-react` for icons
- Vercel for deployment

## App Structure

```text
src/app
  (auth)
    login
    signup
  auth/callback
    Supabase OAuth callback route
  (dashboard)
    dashboard
    tree
    members
    appointments
    settings

src/components
  appointments
  layout
  members
  tree
  ui

src/lib
  relationships.ts
  supabase
  validations

supabase/migrations
  001_initial_schema.sql
```

## Database Model

The initial Supabase migration creates these main tables:

- `families`: A private family workspace.
- `family_members`: Auth users who belong to a family and their workspace role.
- `persons`: People shown in the tree and tracked for health.
- `relationships`: Links between people, such as parent, child, spouse, or sibling.
- `health_conditions`: Medical conditions and hereditary markers for a person.
- `medications`: Medication records for a person.
- `allergies`: Allergy records for a person.
- `appointments`: Family scoped medical appointments.
- `documents`: File references for health documents.

Row Level Security is enabled on all app tables. Policies use family membership checks so users only see records for families they belong to.

## Environment Variables

Create a local `.env.local` file with the values from Supabase and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

For production, set `NEXT_PUBLIC_SITE_URL` to:

```bash
https://family-health-tree.vercel.app
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code. It is for trusted server side usage only.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/001_initial_schema.sql`.
3. Run the `create_family(family_name text)` function SQL if it is not already present.
4. Confirm Row Level Security policies are enabled.
5. Set Authentication URL configuration:
   - Site URL: `https://family-health-tree.vercel.app`
   - Redirect URL: `http://localhost:3000/auth/callback`
   - Redirect URL: `https://family-health-tree.vercel.app/auth/callback`

## Google Auth Setup

Supabase uses Google OAuth through a Google Cloud OAuth client.

1. In Supabase, go to Authentication, then Sign In / Providers, then Google.
2. Enable Sign in with Google.
3. Copy the Supabase callback URL from that panel.
4. In Google Cloud, create an OAuth Client ID with application type `Web application`.
5. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://family-health-tree.vercel.app`
6. Add the authorized redirect URI:
   - The Supabase callback URL, for example `https://your-project-ref.supabase.co/auth/v1/callback`
7. Copy the Google Client ID and Client Secret into the Supabase Google provider panel.
8. Save the Supabase provider configuration.

The app calls `supabase.auth.signInWithOAuth({ provider: 'google' })` and sends users through `/auth/callback` after Supabase finishes the code exchange.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

## Deployment

The app is deployed on Vercel.

Production URL:

```text
https://family-health-tree.vercel.app
```

Deploy from the CLI:

```bash
npx vercel@latest deploy --prod
```

Make sure the Vercel project has the same environment variables as local development, with production URLs where appropriate.

## Notes For Future Work

- Add invitation flows for family members.
- Add richer health timelines per person.
- Add file uploads through Supabase Storage.
- Add relationship editing directly inside the tree canvas.
- Add role based permissions for admins, members, and viewers.
- Add audit logs for sensitive health record updates.
