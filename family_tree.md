# FamilyHealth Project Context For LLMs

This file is written for future LLMs and developers working on the FamilyHealth codebase. It explains what the application does, how the repository is organized, how Supabase and Vercel are wired in, and which files are important for common changes.

## Product Summary

FamilyHealth is a private family care workspace. Users create or join a family, add family members, define relationships between members, and track health information for each person.

The core idea is that a family tree should also be a health coordination tool. A person in the family can track appointments, medications, allergies, health conditions, hereditary risks, and notes for other family members. The tree is meant to make care relationships visually intuitive instead of forcing users to manage everything through flat lists.

## Current Main Features

- Email sign up and sign in through Supabase Auth.
- Google OAuth support through Supabase Auth.
- Private family workspaces.
- Add and edit family members.
- Add relationships while creating or editing members.
- Supported relationship concepts: parent, child, spouse, sibling.
- Interactive Three.js family tree where members are shown as leaves and relationships are shown as branches.
- Member profile pages with health overview and appointments.
- Dashboard cards for members, appointments, conditions, and hereditary risks.
- Clickable dashboard cards that navigate to filtered detail views.
- Appointment pages with in-app upcoming appointment reminders.
- Supabase Row Level Security policies to scope data to family members.
- Vercel deployment.

## Tech Stack

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Postgres.
- Supabase Row Level Security.
- `@supabase/ssr` for server side auth and cookie handling.
- `@supabase/supabase-js` for client and server database calls.
- Three.js for the interactive family tree renderer.
- `react-hook-form` and `zod` for forms and validation.
- `lucide-react` for icons.
- Vercel for production deployment.

## Repository Root Files

```text
.
├── README.md
├── family_tree.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json
├── public/
├── src/
└── supabase/
```

### `README.md`

Human-facing project overview with setup notes. It may be less detailed than this file.

### `family_tree.md`

This file. Use it as the primary project orientation document for future AI agents and developers.

### `package.json`

Defines scripts and dependencies.

Important scripts:

```bash
npm run dev
npm run lint
npm run build
```

Important runtime dependencies:

- `next`
- `react`
- `react-dom`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `three`
- `date-fns`
- `lucide-react`
- `react-hook-form`
- `zod`

Important dev dependencies:

- `typescript`
- `eslint`
- `eslint-config-next`
- `@types/three`

### `.env` And `.env.local`

Local environment files exist in the workspace but should not be committed or exposed. They hold Supabase and site configuration values.

Expected variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Never put the service role key in client code. Only use it from trusted server code when absolutely required.

## Source Structure

```text
src
├── app
│   ├── (auth)
│   ├── (dashboard)
│   ├── auth
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── appointments
│   ├── layout
│   ├── members
│   ├── tree
│   └── ui
├── lib
│   ├── relationships.ts
│   ├── supabase
│   ├── utils.ts
│   └── validations
└── types
    └── index.ts
```

## App Routes

The app uses the Next.js App Router.

### `src/app/layout.tsx`

Root layout. Loads app fonts and global styles. All pages render inside this layout.

### `src/app/globals.css`

Global Tailwind CSS, design tokens, color variables, app background, and utility classes. The UI uses warm off-white backgrounds, red primary actions, soft green accents, and card-based surfaces.

### `src/app/page.tsx`

Public landing page. It includes the FamilyHealth nav, hero copy, and a family tree hero image from `public/family-tree-landing.png`. This is the first page unauthenticated users see.

### `src/app/(auth)/login/page.tsx`

Login page. Supports email login and Google OAuth sign in.

The Google button should call Supabase OAuth with provider `google` and redirect through the app callback route.

### `src/app/(auth)/signup/page.tsx`

Signup page. Supports email signup and Google OAuth sign in.

### `src/app/auth/callback/route.ts`

Supabase OAuth callback handler. Supabase redirects users back here after Google OAuth or magic link style flows. The route exchanges the code for a session and redirects the user into the app.

There is also `src/app/(auth)/callback/route.ts` in the repo structure. Confirm whether both callback routes are still needed before modifying auth routing.

## Dashboard Routes

Dashboard routes are under `src/app/(dashboard)`.

### `src/app/(dashboard)/layout.tsx`

Authenticated application shell. It renders the sidebar, header, and main dashboard layout. It also protects dashboard routes by checking the current Supabase user.

### `src/app/(dashboard)/dashboard/page.tsx`

Main dashboard. It loads:

- Current user.
- User family membership.
- Family name.
- Family member count.
- Upcoming appointments.
- Health condition counts.
- Hereditary condition counts.

Dashboard stat cards are clickable:

- Members card links to `/members`.
- Upcoming card links to `/appointments`.
- Conditions card links to `/members?health=conditions`.
- Hereditary card links to `/members?health=hereditary`.

The dashboard also shows an in-app appointment alert for the next upcoming appointment.

### `src/app/(dashboard)/tree/page.tsx`

Family tree page. It loads all persons and relationships for the current family, then builds a `TreeNode` structure for the Three.js renderer.

Important behavior:

- Parent relationships create child tree links.
- Root members are people without parents.
- If multiple roots exist, a virtual root named `Family` is created.
- Health counts are joined into each `TreeNode`.
- The page passes the resulting tree to `src/components/tree/FamilyTree.tsx`.

### `src/components/tree/FamilyTree.tsx`

Interactive Three.js family tree renderer.

Current visual model:

- The trunk represents the family workspace.
- Curved tube branches represent relationships.
- Leaves represent family members.
- Hovering a leaf shows member details.
- Hovering a branch shows relationship context.
- Clicking a leaf navigates to the member profile page.
- Wheel zoom, drag pan, zoom out, reset, and zoom in are supported.

Important implementation details:

- The component is client-only with `'use client'`.
- It imports `three` directly.
- It converts `TreeNode` data into a local layout model with `buildLayout`.
- It creates an orthographic camera, WebGL renderer, scene lights, trunk, canopy, branches, leaves, labels, and health markers.
- It uses a `Raycaster` for hover and click interaction.
- It disposes geometry and materials in the React effect cleanup.

If you modify this component, always run:

```bash
npm run lint
npm run build
```

### `src/app/(dashboard)/members/page.tsx`

Members list page. It loads persons in the current family and their health conditions.

Supports optional filter query strings:

- `/members?health=conditions`
- `/members?health=hereditary`

Renders `MemberCard` components.

### `src/app/(dashboard)/members/new/page.tsx`

Client page for creating a new family member.

Important behavior:

- Loads the current family membership.
- Loads existing persons in the family.
- Creates a new `persons` row.
- Optionally creates relationship rows using `buildRelationshipInserts` from `src/lib/relationships.ts`.

### `src/app/(dashboard)/members/[id]/page.tsx`

Member detail page.

Loads:

- Person profile.
- Health conditions.
- Medications.
- Allergies.
- Appointments.
- Relationships involving this person.

Shows:

- Profile header.
- Relationship badges.
- Health overview tab.
- Appointments tab.

Reciprocal relationships such as spouse and sibling are deduped for display so the user does not see the same spouse twice.

### `src/app/(dashboard)/members/[id]/edit/page.tsx`

Edit member page.

Shows:

- Personal information form.
- Relationship management panel.

Relationship management is intentionally visible beside the form on desktop so users can immediately add or remove relationship context.

### `src/app/(dashboard)/appointments/page.tsx`

Appointments list page.

Loads all family appointments and separates them into:

- Upcoming.
- Past.

Shows an in-app next appointment alert when there is an upcoming appointment.

### `src/app/(dashboard)/appointments/new/page.tsx`

Create appointment page. Lets the user add an appointment for a family member.

### `src/app/(dashboard)/settings/page.tsx`

Settings and family setup page. Used when a logged-in user does not yet belong to a family. This route is where family creation and joining flows belong.

## Components

### `src/components/layout/Sidebar.tsx`

Application sidebar. Contains navigation links for Dashboard, Family Tree, Members, Appointments, and Settings.

### `src/components/layout/Header.tsx`

Top header area for the dashboard shell.

### `src/components/members/MemberCard.tsx`

Clickable member card used in the members list. Shows initials, name, age, active condition count, and hereditary count.

### `src/components/members/EditMemberForm.tsx`

Client form for editing basic person information. Updates the `persons` table.

### `src/components/members/RelationshipManager.tsx`

Client component for adding and removing relationships for a person.

Important behavior:

- Shows existing relationships involving the person.
- Dedupes reciprocal spouse and sibling rows for display.
- Inserts relationships using `buildRelationshipInserts`.
- Deletes both sides of reciprocal spouse and sibling relationships when removing.

### `src/components/members/HealthSummary.tsx`

Displays conditions, medications, and allergies for a member.

### `src/components/appointments/AppointmentForm.tsx`

Client appointment creation form.

### `src/components/appointments/AppointmentList.tsx`

Displays appointment cards. Upcoming appointments within seven days get an in-app reminder badge. Overdue appointments get an overdue badge.

### `src/components/ui/*`

Shared UI primitives generated or adapted from the app’s component system. Examples include button, card, badge, avatar, tabs, dialog, input, label, select, separator, sheet, and textarea.

Prefer using these components instead of raw controls when adding UI.

## Library Files

### `src/lib/supabase/client.ts`

Creates a browser Supabase client. Use this from client components.

### `src/lib/supabase/server.ts`

Creates a server Supabase client using cookies. Use this from server components, route handlers, and server-side data loading.

### `src/lib/relationships.ts`

Relationship helper utilities.

Important exports:

- `RelativeRole`
- `RelationshipInsert`
- `fullName`
- `buildRelationshipInserts`
- `describeRelationship`

Important relationship rules:

- `parent`: person is parent of related person.
- `child`: stored as the related person being parent of the new person.
- `spouse`: stored in both directions.
- `sibling`: stored in both directions.

Because spouse and sibling rows are reciprocal, display code must dedupe them.

### `src/lib/validations/member.ts`

Zod schema for member forms.

### `src/lib/validations/appointment.ts`

Zod schema for appointment forms.

### `src/lib/utils.ts`

Shared utility helpers such as `cn` for class names.

## Type Definitions

### `src/types/index.ts`

Central TypeScript types for app data:

- `UserRole`
- `RelationshipType`
- `ConditionStatus`
- `AllergySeverity`
- `Family`
- `FamilyMember`
- `Person`
- `Relationship`
- `HealthCondition`
- `Medication`
- `Allergy`
- `Appointment`
- `Document`
- `PersonWithHealth`
- `TreeNode`

`TreeNode` is the transformed structure consumed by the family tree renderer. It includes display values and health counters.

## Supabase Schema

Main schema file:

```text
supabase/migrations/001_initial_schema.sql
```

The migration creates:

- `families`
- `family_members`
- `persons`
- `relationships`
- `health_conditions`
- `medications`
- `allergies`
- `appointments`
- `documents`

It also enables Row Level Security on all app tables.

## Supabase Data Model

### `families`

Represents a private family workspace.

Fields include:

- `id`
- `name`
- `invite_code`
- `created_at`

### `family_members`

Connects authenticated users to families.

Fields include:

- `id`
- `family_id`
- `user_id`
- `role`
- `created_at`

Roles:

- `admin`
- `member`
- `viewer`

### `persons`

Represents a person in the family tree. A person may or may not have an app login.

Fields include:

- `id`
- `family_id`
- `user_id`
- `first_name`
- `last_name`
- `date_of_birth`
- `gender`
- `photo_url`
- `notes`
- `created_at`

### `relationships`

Represents relationships between persons.

Fields include:

- `id`
- `family_id`
- `person_id`
- `related_person_id`
- `relationship_type`

Supported relationship types:

- `parent`
- `child`
- `spouse`
- `sibling`

In practice, parent links are the most important for tree layout. Spouse and sibling links are saved and displayed on profile pages, and can be used for richer future tree rendering.

### `health_conditions`

Medical conditions for a person.

Fields include:

- `id`
- `person_id`
- `name`
- `is_hereditary`
- `diagnosed_date`
- `status`
- `notes`
- `created_at`

Statuses:

- `active`
- `resolved`
- `chronic`

### `medications`

Medication records for a person.

### `allergies`

Allergy records for a person.

### `appointments`

Family scoped medical appointments.

Fields include:

- `id`
- `person_id`
- `family_id`
- `title`
- `doctor_name`
- `location`
- `appointment_date`
- `notes`
- `is_completed`
- `created_by`
- `created_at`

### `documents`

References to health documents. Storage upload behavior can be expanded later with Supabase Storage.

## Row Level Security

The migration defines an `is_family_member(fid uuid)` helper function.

Most policies use this helper so users can only read or write records in families they belong to.

Important rule:

Never bypass RLS from the browser. All client-side queries should use the anon key and rely on policies.

## Family Creation Function

The app expects a database function:

```sql
create or replace function create_family(family_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_family_id uuid;
begin
  insert into families (name) values (family_name) returning id into new_family_id;
  insert into family_members (family_id, user_id, role)
    values (new_family_id, auth.uid(), 'admin');
  return new_family_id;
end;
$$;
```

This function creates a family and immediately adds the current authenticated user as an admin.

## Supabase Auth

The app uses Supabase Auth for:

- Email sign in.
- Email sign up.
- Google OAuth.
- Session cookies through `@supabase/ssr`.

## Google OAuth Setup

Supabase Google provider setup requires a Google OAuth Web client.

In Google Cloud:

1. Configure the OAuth consent screen.
2. Create an OAuth Client ID.
3. Application type should be `Web application`.
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://family-health-tree.vercel.app`
5. Add authorized redirect URI:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

In Supabase:

1. Go to Authentication.
2. Go to Sign In / Providers.
3. Open Google.
4. Enable Sign in with Google.
5. Paste the Google OAuth Client ID into `Client IDs`.
6. Paste the Google OAuth Client Secret into `Client Secret`.
7. Save.

Important:

- The Supabase provider `Client IDs` field expects the Google OAuth Client ID, not the Supabase anon key.
- The Client ID usually looks like `1234567890-abc123.apps.googleusercontent.com`.
- Keep nonce checks enabled unless there is a strong reason not to.
- Do not allow users without email unless needed.

## Supabase URL Configuration

In Supabase Authentication URL Configuration:

Site URL for production:

```text
https://family-health-tree.vercel.app
```

Redirect URLs:

```text
http://localhost:3000/auth/callback
https://family-health-tree.vercel.app/auth/callback
```

Preview deployments may need additional redirect URLs if testing OAuth on Vercel preview domains.

## Vercel Deployment

The app is connected to Vercel. Pushes to GitHub `main` can trigger production deployments if Vercel auto-deploy is enabled.

Production URL:

```text
https://family-health-tree.vercel.app
```

Manual production deploy:

```bash
npx vercel@latest deploy --prod
```

Environment variables must be configured in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

For production:

```bash
NEXT_PUBLIC_SITE_URL=https://family-health-tree.vercel.app
```

## GitHub

Repository:

```text
https://github.com/vinayanand3/family-health-tree.git
```

Main branch:

```text
main
```

Before committing, usually run:

```bash
npm run lint
npm run build
```

Do not commit `.env`, `.env.local`, or local-only changes.

## Common Implementation Notes

### Adding A New Dashboard Metric

Edit:

```text
src/app/(dashboard)/dashboard/page.tsx
```

Load data server-side through `createClient` from `src/lib/supabase/server.ts`. Add a card with a clear route target.

### Adding New Member Health Data

Likely files:

```text
src/types/index.ts
src/components/members/HealthSummary.tsx
src/app/(dashboard)/members/[id]/page.tsx
supabase/migrations/
```

Add database table or fields through a Supabase migration, then update types and UI.

### Modifying Relationship Behavior

Likely files:

```text
src/lib/relationships.ts
src/components/members/RelationshipManager.tsx
src/app/(dashboard)/tree/page.tsx
src/components/tree/FamilyTree.tsx
```

Be careful with reciprocal relationships. Spouse and sibling are stored in both directions.

### Modifying The Family Tree Renderer

Primary file:

```text
src/components/tree/FamilyTree.tsx
```

Data source:

```text
src/app/(dashboard)/tree/page.tsx
```

The renderer should not query Supabase directly. It should receive tree data from the page.

### Appointment Reminder Behavior

Current reminders are free in-app UI markers. No email, SMS, or push notification provider is currently used.

Important files:

```text
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/appointments/page.tsx
src/components/appointments/AppointmentList.tsx
```

### Landing Page Hero

Primary file:

```text
src/app/page.tsx
```

Hero image:

```text
public/family-tree-landing.png
```

## Current Known Limitations

- Invitation flow is not fully built.
- Role-specific permissions are basic.
- The Three.js tree is visually richer but still uses the `TreeNode` hierarchy generated from parent links.
- Spouse and sibling relationships are not yet first-class branches in the Three.js layout.
- Appointment alerts are in-app only.
- Email or SMS appointment reminders would require external services.
- Document upload flow is not fully implemented.
- Supabase migrations are stored as SQL, but there is no full migration runner workflow documented in the repo.

## Suggested Future Improvements

- Build real invitation workflow with invite codes.
- Add branch grouping for spouses and sibling groups in the Three.js renderer.
- Add a selected member drawer inside the tree view.
- Add WebGL fallback for browsers without WebGL support.
- Add richer health timeline per person.
- Add Supabase Storage uploads for documents.
- Add audit log for sensitive health record edits.
- Add admin/member/viewer permission differences.
- Add notification settings for appointment reminders.
- Add optional calendar export using `.ics` files for free external reminders.

## Development Checklist

When making code changes:

1. Read the relevant route and component files first.
2. Keep data loading in server components where possible.
3. Use client components only for interactive forms and browser-only APIs such as Three.js.
4. Use the existing UI components in `src/components/ui`.
5. Use Supabase RLS instead of client-side filtering for privacy boundaries.
6. Run lint and build.
7. Do not commit secrets or local env files.

## Verification Commands

```bash
npm run lint
npm run build
git status --short
```

## Important Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Do not weaken RLS policies without understanding the privacy impact.
- Health information is sensitive, so every query should remain family scoped.
- Google OAuth client secrets belong in Supabase provider config, not in browser code.
- Vercel environment variables should be reviewed before production deploys.
