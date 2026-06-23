insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can read product image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "Admins can upload product image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "Admins can update product image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "Admins can delete product image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

create policy "Admins can delete product images"
on public.product_images
for delete
to authenticated
using (public.is_admin());
