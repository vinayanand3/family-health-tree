-- User-level notification preferences for scheduled reminder delivery
create table if not exists user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean default true,
  sms_enabled boolean default false,
  phone_number text,
  push_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_notification_preferences enable row level security;

drop policy if exists "user_notification_preferences_read" on user_notification_preferences;
create policy "user_notification_preferences_read" on user_notification_preferences
  for select using (user_id = auth.uid());

drop policy if exists "user_notification_preferences_write" on user_notification_preferences;
create policy "user_notification_preferences_write" on user_notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Delivery log prevents cron jobs from sending the same reminder repeatedly.
create table if not exists care_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_key text not null,
  family_id uuid references families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  channel text check (channel in ('email', 'sms', 'push')) not null,
  status text check (status in ('sent', 'skipped', 'failed')) not null,
  provider text,
  error text,
  sent_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(reminder_key, user_id, channel)
);

alter table care_reminder_deliveries enable row level security;

drop policy if exists "care_reminder_deliveries_read" on care_reminder_deliveries;
create policy "care_reminder_deliveries_read" on care_reminder_deliveries
  for select using (user_id = auth.uid());
