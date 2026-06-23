create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select au.role
  from public.admin_users au
  where au.user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() in ('owner', 'admin', 'editor')
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

create policy "Admins can read own admin profile"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert admin users"
on public.admin_users
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update admin users"
on public.admin_users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can read categories"
on public.categories
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (status = 'active');

create policy "Admins can read products"
on public.products
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active product categories"
on public.product_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    join public.categories c on c.id = product_categories.category_id
    where p.id = product_categories.product_id
      and p.status = 'active'
      and c.is_active = true
  )
);

create policy "Admins can read product categories"
on public.product_categories
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert product categories"
on public.product_categories
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update product categories"
on public.product_categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
  )
);

create policy "Admins can read product images"
on public.product_images
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert product images"
on public.product_images
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update product images"
on public.product_images
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
