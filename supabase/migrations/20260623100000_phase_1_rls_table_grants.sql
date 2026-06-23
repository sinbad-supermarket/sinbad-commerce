grant usage on schema public to anon, authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant select on public.product_images to anon, authenticated;

grant select, insert, update on public.admin_users to authenticated;
grant insert, update on public.categories to authenticated;
grant insert, update on public.products to authenticated;
grant insert, update on public.product_categories to authenticated;
grant insert, update, delete on public.product_images to authenticated;
