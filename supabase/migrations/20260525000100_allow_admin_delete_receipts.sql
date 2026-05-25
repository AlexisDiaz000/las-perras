drop policy if exists "Users can delete their own receipts" on storage.objects;
create policy "Users can delete their own receipts"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (
    owner = auth.uid()
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
);
