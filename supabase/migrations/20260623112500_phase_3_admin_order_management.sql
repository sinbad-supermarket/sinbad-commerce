alter table public.orders
drop constraint if exists orders_order_status_check;

alter table public.orders
add constraint orders_order_status_check
check (order_status in (
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
));

alter table public.vendor_orders
drop constraint if exists vendor_orders_status_check;

alter table public.vendor_orders
add constraint vendor_orders_status_check
check (status in (
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
));

grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, update on public.vendor_orders to authenticated;

create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

create policy "Admins can read vendor orders"
on public.vendor_orders
for select
to authenticated
using (public.is_admin());

create policy "Admins can update vendor orders"
on public.vendor_orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
