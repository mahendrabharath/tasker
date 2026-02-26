-- Storage RLS: allow authenticated users to upload to task-images bucket
-- Path format: user_id/task_id/uuid.ext — users can only upload to their own folder

create policy "Allow authenticated uploads to task-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read for task-images (public bucket)
create policy "Allow public read task-images"
on storage.objects
for select
to public
using (bucket_id = 'task-images');
