-- Public profile photo storage for family member avatars.
-- Run this in Supabase SQL Editor if the profile-photos bucket does not exist.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_photos_read"
on storage.objects
for select
using (bucket_id = 'profile-photos');

create policy "profile_photos_insert"
on storage.objects
for insert
with check (
  bucket_id = 'profile-photos'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "profile_photos_update"
on storage.objects
for update
using (
  bucket_id = 'profile-photos'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "profile_photos_delete"
on storage.objects
for delete
using (
  bucket_id = 'profile-photos'
  and auth.uid() is not null
  and split_part(name, '/', 1) = auth.uid()::text
);
