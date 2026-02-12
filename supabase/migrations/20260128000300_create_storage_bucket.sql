-- Create receipts bucket if not exists
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Enable RLS
-- alter table storage.objects enable row level security;

-- Policy to allow authenticated users to upload files
create policy "Authenticated users can upload receipts"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'receipts' );

-- Policy to allow authenticated users to update their own files (optional)
create policy "Users can update their own receipts"
on storage.objects for update
to authenticated
using ( bucket_id = 'receipts' and owner = auth.uid() );

-- Policy to allow authenticated users to delete their own files (optional)
create policy "Users can delete their own receipts"
on storage.objects for delete
to authenticated
using ( bucket_id = 'receipts' and owner = auth.uid() );

-- Policy to allow public read access (since the bucket is public)
create policy "Public Access to Receipts"
on storage.objects for select
to public
using ( bucket_id = 'receipts' );
