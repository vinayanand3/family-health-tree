-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- Families
-- ────────────────────────────────────────────────────────────
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique default lower(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Family members (app users belonging to a family)
-- ────────────────────────────────────────────────────────────
create table family_members (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid references families(id) on delete cascade,
  user_id    uuid references auth.users(id),
  role       text check (role in ('admin', 'member', 'viewer')) default 'member',
  created_at timestamptz default now(),
  unique(family_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- Persons (people in the tree; may or may not be app users)
-- ────────────────────────────────────────────────────────────
create table persons (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid references families(id) on delete cascade,
  user_id       uuid references auth.users(id),
  first_name    text not null,
  last_name     text,
  date_of_birth date,
  gender        text,
  photo_url     text,
  notes         text,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Relationships
-- ────────────────────────────────────────────────────────────
create table relationships (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid references families(id) on delete cascade,
  person_id           uuid references persons(id) on delete cascade,
  related_person_id   uuid references persons(id) on delete cascade,
  relationship_type   text check (relationship_type in ('parent', 'child', 'spouse', 'sibling')),
  unique(person_id, related_person_id, relationship_type)
);

-- ────────────────────────────────────────────────────────────
-- Health conditions
-- ────────────────────────────────────────────────────────────
create table health_conditions (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid references persons(id) on delete cascade,
  name            text not null,
  is_hereditary   boolean default false,
  diagnosed_date  date,
  status          text check (status in ('active', 'resolved', 'chronic')) default 'active',
  notes           text,
  created_at      timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Medications
-- ────────────────────────────────────────────────────────────
create table medications (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid references persons(id) on delete cascade,
  name        text not null,
  dosage      text,
  frequency   text,
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Allergies
-- ────────────────────────────────────────────────────────────
create table allergies (
  id        uuid primary key default gen_random_uuid(),
  person_id uuid references persons(id) on delete cascade,
  allergen  text not null,
  severity  text check (severity in ('mild', 'moderate', 'severe')),
  notes     text
);

-- ────────────────────────────────────────────────────────────
-- Appointments
-- ────────────────────────────────────────────────────────────
create table appointments (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid references persons(id) on delete cascade,
  family_id        uuid references families(id) on delete cascade,
  title            text not null,
  doctor_name      text,
  location         text,
  appointment_date timestamptz not null,
  notes            text,
  is_completed     boolean default false,
  created_by       uuid references auth.users(id),
  created_at       timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Documents (file references in Supabase Storage)
-- ────────────────────────────────────────────────────────────
create table documents (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid references persons(id) on delete cascade,
  name        text not null,
  file_path   text not null,
  file_type   text,
  uploaded_by uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- Row-Level Security
-- ────────────────────────────────────────────────────────────
alter table families         enable row level security;
alter table family_members   enable row level security;
alter table persons          enable row level security;
alter table relationships    enable row level security;
alter table health_conditions enable row level security;
alter table medications      enable row level security;
alter table allergies        enable row level security;
alter table appointments     enable row level security;
alter table documents        enable row level security;

-- Helper: is the current user a member of the given family?
create or replace function is_family_member(fid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

-- Families: members can see their own family
create policy "family_members_read" on families
  for select using (is_family_member(id));

create policy "family_members_insert" on families
  for insert with check (true);

-- Family members table
create policy "fm_read" on family_members
  for select using (is_family_member(family_id));

create policy "fm_insert" on family_members
  for insert with check (user_id = auth.uid());

-- Persons
create policy "persons_read" on persons
  for select using (is_family_member(family_id));

create policy "persons_insert" on persons
  for insert with check (is_family_member(family_id));

create policy "persons_update" on persons
  for update using (is_family_member(family_id));

create policy "persons_delete" on persons
  for delete using (is_family_member(family_id));

-- Relationships
create policy "rel_read" on relationships
  for select using (is_family_member(family_id));

create policy "rel_insert" on relationships
  for insert with check (is_family_member(family_id));

create policy "rel_delete" on relationships
  for delete using (is_family_member(family_id));

-- Health conditions, medications, allergies — scoped via person → family
create policy "hc_read" on health_conditions
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "hc_write" on health_conditions
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "med_read" on medications
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "med_write" on medications
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "allergy_read" on allergies
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "allergy_write" on allergies
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

-- Appointments
create policy "appt_read" on appointments
  for select using (is_family_member(family_id));

create policy "appt_write" on appointments
  for all using (is_family_member(family_id));

-- Documents
create policy "doc_read" on documents
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

create policy "doc_write" on documents
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));
