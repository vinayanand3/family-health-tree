-- Manual RLS validation for two separate users and families.
-- Replace these two values with real auth.users IDs from two different families.
-- Run this in the Supabase SQL editor after all migrations are applied.

begin;

-- User A should see only their family rows.
select set_config('request.jwt.claim.sub', 'USER_A_UUID_HERE', true);
select 'user_a_families' as check_name, count(*) as visible_rows from families;
select 'user_a_persons' as check_name, count(*) as visible_rows from persons;
select 'user_a_appointments' as check_name, count(*) as visible_rows from appointments;
select 'user_a_vaccinations' as check_name, count(*) as visible_rows from vaccinations;
select 'user_a_metadata' as check_name, count(*) as visible_rows from person_health_metadata;
select 'user_a_measurements' as check_name, count(*) as visible_rows from health_measurements;
select 'user_a_preferences' as check_name, count(*) as visible_rows from user_notification_preferences;
select 'user_a_delivery_logs' as check_name, count(*) as visible_rows from care_reminder_deliveries;

-- User B should see only their family rows.
select set_config('request.jwt.claim.sub', 'USER_B_UUID_HERE', true);
select 'user_b_families' as check_name, count(*) as visible_rows from families;
select 'user_b_persons' as check_name, count(*) as visible_rows from persons;
select 'user_b_appointments' as check_name, count(*) as visible_rows from appointments;
select 'user_b_vaccinations' as check_name, count(*) as visible_rows from vaccinations;
select 'user_b_metadata' as check_name, count(*) as visible_rows from person_health_metadata;
select 'user_b_measurements' as check_name, count(*) as visible_rows from health_measurements;
select 'user_b_preferences' as check_name, count(*) as visible_rows from user_notification_preferences;
select 'user_b_delivery_logs' as check_name, count(*) as visible_rows from care_reminder_deliveries;

-- Cross-family write test:
-- Replace PERSON_FROM_USER_A_FAMILY with a person ID in User A's family while still acting as User B.
-- This insert should fail or affect 0 allowed rows because policies scope through persons.family_id.
insert into vaccinations (person_id, vaccine_name, status)
values ('PERSON_FROM_USER_A_FAMILY', 'RLS should block this', 'scheduled');

rollback;
