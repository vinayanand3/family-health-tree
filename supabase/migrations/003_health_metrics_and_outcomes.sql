-- Appointment outcomes and follow-up tracking
alter table appointments
  add column if not exists outcome_notes text,
  add column if not exists follow_up_needed boolean default false,
  add column if not exists follow_up_date timestamptz,
  add column if not exists completed_at timestamptz;

-- Medication refill tracking
alter table medications
  add column if not exists refill_due_date date,
  add column if not exists pharmacy text,
  add column if not exists prescriber text,
  add column if not exists reminder_enabled boolean default false;

-- Vaccination records
create table if not exists vaccinations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references persons(id) on delete cascade,
  vaccine_name text not null,
  dose_label text,
  administered_date date,
  due_date date,
  status text check (status in ('up_to_date', 'due', 'overdue', 'scheduled')) default 'scheduled',
  provider text,
  notes text,
  created_at timestamptz default now()
);

alter table vaccinations enable row level security;

drop policy if exists "vaccinations_read" on vaccinations;
create policy "vaccinations_read" on vaccinations
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

drop policy if exists "vaccinations_write" on vaccinations;
create policy "vaccinations_write" on vaccinations
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

-- Member health metadata
create table if not exists person_health_metadata (
  person_id uuid primary key references persons(id) on delete cascade,
  blood_type text,
  last_checkup_date date,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  insurance_provider text,
  insurance_member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table person_health_metadata enable row level security;

drop policy if exists "person_health_metadata_read" on person_health_metadata;
create policy "person_health_metadata_read" on person_health_metadata
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

drop policy if exists "person_health_metadata_write" on person_health_metadata;
create policy "person_health_metadata_write" on person_health_metadata
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

-- Growth and BMI measurements
create table if not exists health_measurements (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references persons(id) on delete cascade,
  measured_at date not null,
  height_cm numeric,
  weight_kg numeric,
  bmi numeric,
  growth_percentile numeric,
  notes text,
  created_at timestamptz default now()
);

alter table health_measurements enable row level security;

drop policy if exists "health_measurements_read" on health_measurements;
create policy "health_measurements_read" on health_measurements
  for select using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));

drop policy if exists "health_measurements_write" on health_measurements;
create policy "health_measurements_write" on health_measurements
  for all using (exists (
    select 1 from persons p where p.id = person_id and is_family_member(p.family_id)
  ));
