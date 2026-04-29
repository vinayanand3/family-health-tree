# FamilyHealth Project Handoff

This file is a compact handoff for future LLM threads and developers. If a new assistant reads only one file before working, start here, then inspect the specific source files mentioned below.

## Product Goal

FamilyHealth is a private family health workspace. A user creates a shared family group, invites relatives, adds family members, defines relationships, and tracks health information for each person.

The product vision is:

- A family tree that is visual, intuitive, and emotionally engaging.
- Health records attached to people, not scattered across flat lists.
- Shared coordination for appointments, conditions, medications, allergies, hereditary risks, notes, and relationships.
- A modern interface that feels polished, warm, and useful for real family care.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- `@supabase/ssr`
- `@supabase/supabase-js`
- `@xyflow/react` for the interactive family tree
- `react-hook-form` and `zod`
- `date-fns`
- `lucide-react`
- Vercel for production deployment

## Environment And Deployment

Local environment uses `.env.local`. Do not commit env files.

Expected env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Vercel already has the Production and Preview env vars configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Production site:

```text
https://family-health-tree.vercel.app
```

Deployment has been done with:

```bash
npx vercel@latest deploy . --prod -y
```

GitHub repo:

```text
https://github.com/vinayanand3/family-health-tree.git
```

## Important Local Notes

Current repo has local files that should not be touched unless the user asks:

- `AGENTS.md` is modified locally.
- `commit-and-deploy.command` is untracked.

The user instruction in `AGENTS.md` says: never use em dashes.

## Main User Flows

### Account And Family Creation

Users can sign up with email or Google through Supabase Auth.

After auth:

- If the user is already in a family, they go to the dashboard.
- If they are not in a family, they go to Settings.
- In Settings they can create a new family or join an existing one.

Important files:

- `src/app/(auth)/signup/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/(auth)/callback/route.ts`
- `src/app/(dashboard)/settings/page.tsx`
- `src/proxy.ts`

### Invitation Code Flow

The invite code is stored on the `families` table as `invite_code`.

How it works now:

1. A family owner creates a family in Settings.
2. Settings shows the invite code and a "Copy invite link" button.
3. The invite link is:

```text
https://family-health-tree.vercel.app/signup?invite=CODE
```

4. A relative opens that link.
5. Signup reads the invite code from the URL and stores it locally.
6. Signup sends the invite code through auth callback metadata and redirect URL.
7. The auth callback tries to find the family by invite code and inserts a `family_members` row for the new user.
8. If automatic join does not complete, Settings pre-fills the saved invite code and asks the user to click Join Family.

Known improvement area:

- The invite flow is better now, but it should eventually have a dedicated onboarding page with two clear choices: "Create family" and "Join with invite".
- It should show success and failure states after auth callback, not silently redirect.

### Family Members

Users can add and edit family members.

Member fields:

- first name
- last name
- date of birth
- gender
- notes
- profile photo URL

Profile photo upload now exists in member create and edit forms. It uploads to Supabase Storage bucket `profile-photos`, saves the public URL in `persons.photo_url`, and displays it on profiles, member cards, and tree nodes.

Important files:

- `src/app/(dashboard)/members/new/page.tsx`
- `src/app/(dashboard)/members/[id]/page.tsx`
- `src/app/(dashboard)/members/[id]/edit/page.tsx`
- `src/components/members/EditMemberForm.tsx`
- `src/components/members/MemberCard.tsx`
- `src/components/members/ProfilePhotoUpload.tsx`
- `src/lib/validations/member.ts`

Supabase setup for photos:

- `supabase/migrations/002_profile_photos_storage.sql`

This migration creates the `profile-photos` bucket and storage policies. It must be run in Supabase SQL Editor before uploads work.

### Relationships

Supported relationship concepts:

- parent
- child
- spouse
- sibling

Relationships are stored in `relationships`.

Relationship creation and editing is handled by:

- `src/lib/relationships.ts`
- `src/components/members/RelationshipManager.tsx`
- `src/app/(dashboard)/members/new/page.tsx`
- `src/app/(dashboard)/members/[id]/edit/page.tsx`

Earlier issue fixed:

- Spouse relationships were displayed twice on profile pages because reciprocal relationships were both shown. The profile page now filters reciprocal spouse and sibling relationships for display.

Known improvement area:

- Relationship management works, but the UI can still be more guided. The user wants it to be intuitive enough for normal family members.
- Future improvement: add a guided relationship wizard with examples like "Divija is parent of Vivin" and "Vinay is spouse of Divija".

### Family Tree

Current tree uses React Flow through `@xyflow/react`.

Important file:

- `src/components/tree/FamilyTree.tsx`

Tree page data loading:

- `src/app/(dashboard)/tree/page.tsx`

Current tree behavior:

- Shows members as profile cards with circular avatars.
- Uses uploaded profile photos if available.
- Shows initials when no photo exists.
- Shows parent, spouse, and sibling labels on lines.
- Spouse line label is `Spouse`.
- Parent line label is `Parent`.
- Sibling line label is `Sibling`.
- Hovering a person shows a tooltip with health info and upcoming appointments.
- Clicking a person should navigate to `/members/[id]`.
- Nodes have a native `Link` overlay to make click navigation more reliable inside React Flow.

Recent design direction:

- The user wants the tree to feel more creative than a basic canvas.
- We briefly explored a tree or garden metaphor with branches and leaves.
- Current implementation improved the React Flow layout with profile cards, labels, colors, and leaf accents, but it is still not the final creative vision.

Known improvement area:

- The user is interested in a future 3D or immersive family tree where branches represent family lines and leaves represent members.
- If implementing 3D later, use Three.js carefully and test canvas rendering across desktop and mobile.
- For now, React Flow is more stable for editing, clicking, and relationship labels.

### Health Records

Member profiles now include inline Add forms for:

- Conditions
- Medications
- Allergies

Important file:

- `src/components/members/HealthSummary.tsx`

The health forms write directly to Supabase from the client and refresh the profile after saving.

Conditions fields:

- name
- status: active, chronic, resolved
- diagnosed date
- hereditary flag
- notes

Medications fields:

- name
- dosage
- frequency
- start date
- end date
- notes

Allergies fields:

- allergen
- severity: mild, moderate, severe
- notes

Known improvement area:

- Add edit and delete controls for existing health records.
- Consider adding templates or autocomplete for common conditions, medications, and allergies.
- Consider showing health record history over time.

### Appointments

Users can add appointments and view upcoming/past appointments.

Important files:

- `src/app/(dashboard)/appointments/page.tsx`
- `src/app/(dashboard)/appointments/new/page.tsx`
- `src/components/appointments/AppointmentForm.tsx`
- `src/components/appointments/AppointmentList.tsx`

Dashboard shows an appointment alert for the next upcoming appointment.

Tree hover tooltips show the next three incomplete future appointments per person.

Known improvement area:

- Add free notification support. Best free options are browser notifications, email through a free provider, or calendar file export. Native push notifications need more setup.

## Dashboard

Important file:

- `src/app/(dashboard)/dashboard/page.tsx`

Current behavior:

- Shows family workspace name.
- Dashboard cards are clickable:
  - Members
  - Upcoming appointments
  - Conditions
  - Hereditary markers
- Shows next appointment alert when an appointment exists.

## Supabase Schema

Main migration:

- `supabase/migrations/001_initial_schema.sql`

Storage migration:

- `supabase/migrations/002_profile_photos_storage.sql`

Core tables:

- `families`
- `family_members`
- `persons`
- `relationships`
- `health_conditions`
- `medications`
- `allergies`
- `appointments`
- `documents`

RLS policy design:

- Family-scoped data is readable and writable only by authenticated users who belong to the same family.
- Health record tables are scoped through `persons.family_id`.
- Appointments are scoped directly by `family_id`.
- Profile photo uploads are stored under the authenticated user's ID in Storage.

Important Supabase RPC:

- `create_family(family_name text)`

It creates a family and inserts the current auth user as admin in `family_members`.

## Files To Inspect First For Common Tasks

For auth and invite flow:

- `src/app/(auth)/signup/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/(dashboard)/settings/page.tsx`

For member form and profile photos:

- `src/app/(dashboard)/members/new/page.tsx`
- `src/components/members/EditMemberForm.tsx`
- `src/components/members/ProfilePhotoUpload.tsx`

For member profile and health records:

- `src/app/(dashboard)/members/[id]/page.tsx`
- `src/components/members/HealthSummary.tsx`

For relationships:

- `src/lib/relationships.ts`
- `src/components/members/RelationshipManager.tsx`

For tree rendering:

- `src/components/tree/FamilyTree.tsx`
- `src/app/(dashboard)/tree/page.tsx`

For dashboard:

- `src/app/(dashboard)/dashboard/page.tsx`

For Supabase:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_profile_photos_storage.sql`

## Recent Commits From This Work

- `8268238` Improve family tree interactions and labels
- `cc99097` Show appointment previews on family tree hover
- `0b97dc3` Add health record entry forms
- `a940f9e` Clarify invites and add profile photo uploads

## Current Verification Commands

Use these after implementation:

```bash
npm run lint
npm run build
```

Known current lint warnings:

- React Hook Form `watch()` warning in member forms.
- Next.js `<img>` warnings in `FamilyTree.tsx`.

These warnings have not blocked builds.

## High Priority Next Improvements

1. Run `supabase/migrations/002_profile_photos_storage.sql` in Supabase so uploads work.
2. Test full invite flow with a real new account.
3. Test Google auth with invite links.
4. Add edit and delete controls for conditions, medications, allergies, and appointments.
5. Improve family tree visual creativity beyond the current React Flow profile-card layout.
6. Add a more guided first-run onboarding flow.
7. Add user-friendly empty states and explain what to do next on each major page.
8. Add free appointment reminders, likely browser notifications or calendar export first.
9. Improve mobile layout for tree and profile forms.
10. Add tests for relationship inserts and invite-code joins.

## Product Tone And Design Direction

The app should feel:

- Modern
- Warm
- Family-oriented
- Health-aware
- Trustworthy
- Easy for nontechnical relatives

Avoid making it feel like a generic admin dashboard. The family tree is the product centerpiece, so changes should keep making it more intuitive, visual, and emotionally engaging while preserving practical health tracking.
