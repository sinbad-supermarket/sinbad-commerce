create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  confirmation_token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  cart_id uuid references public.carts(id) on delete set null,
  customer_name text not null check (length(trim(customer_name)) > 0),
  customer_phone text not null check (length(trim(customer_phone)) > 0),
  customer_email text,
  delivery_area text not null check (length(trim(delivery_area)) > 0),
  delivery_address text not null check (length(trim(delivery_address)) > 0),
  delivery_notes text,
  payment_method text not null check (payment_method in ('cash_on_delivery')),
  payment_status text not null check (payment_status in ('pending')),
  order_status text not null check (order_status in ('placed', 'cancelled')),
  subtotal numeric(12, 3) not null check (subtotal >= 0),
  delivery_fee numeric(12, 3) not null default 0 check (delivery_fee >= 0),
  total numeric(12, 3) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  vendor_id uuid not null references public.vendors(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 3),
  line_total numeric(12, 3),
  product_name_en text not null,
  product_name_ar text not null,
  product_slug text not null,
  vendor_name_en text not null,
  vendor_slug text not null,
  created_at timestamptz not null default now()
);

create table public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id),
  vendor_subtotal numeric(12, 3) not null check (vendor_subtotal >= 0),
  status text not null default 'placed' check (status in ('placed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, vendor_id)
);

create index orders_order_number_idx on public.orders(order_number);
create index orders_cart_id_idx on public.orders(cart_id);
create index orders_order_status_idx on public.orders(order_status);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
create index order_items_vendor_id_idx on public.order_items(vendor_id);
create index vendor_orders_order_id_idx on public.vendor_orders(order_id);
create index vendor_orders_vendor_id_idx on public.vendor_orders(vendor_id);

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger set_vendor_orders_updated_at
before update on public.vendor_orders
for each row
execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.vendor_orders enable row level security;

create or replace function public.create_cod_order_from_cart(
  p_cart_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_area text,
  p_delivery_address text,
  p_delivery_notes text
)
returns table(order_number text, confirmation_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cart_record public.carts%rowtype;
  item_count integer;
  eligible_count integer;
  generated_order_number text;
  generated_confirmation_token text;
  created_order_id uuid;
  order_subtotal numeric(12, 3);
  order_delivery_fee numeric(12, 3) := 0;
  order_total numeric(12, 3);
begin
  select *
  into cart_record
  from public.carts
  where id = p_cart_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active cart was not found.';
  end if;

  select count(*)
  into item_count
  from public.cart_items ci
  where ci.cart_id = p_cart_id;

  if item_count = 0 then
    raise exception 'Cart is empty.';
  end if;

  select count(*)
  into eligible_count
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  join public.vendors v on v.id = p.vendor_id
  where ci.cart_id = p_cart_id
    and ci.vendor_id = p.vendor_id
    and p.status = 'active'
    and p.review_status = 'approved'
    and v.status = 'active'
    and v.is_public = true;

  if eligible_count <> item_count then
    raise exception 'One or more cart items are no longer available.';
  end if;

  select coalesce(sum(coalesce(ci.unit_price, 0) * ci.quantity), 0)::numeric(12, 3)
  into order_subtotal
  from public.cart_items ci
  where ci.cart_id = p_cart_id;

  order_total := (order_subtotal + order_delivery_fee)::numeric(12, 3);

  loop
    generated_order_number := 'SCL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (
      select 1 from public.orders o where o.order_number = generated_order_number
    );
  end loop;

  generated_confirmation_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.orders (
    order_number,
    confirmation_token,
    cart_id,
    customer_name,
    customer_phone,
    customer_email,
    delivery_area,
    delivery_address,
    delivery_notes,
    payment_method,
    payment_status,
    order_status,
    subtotal,
    delivery_fee,
    total
  )
  values (
    generated_order_number,
    generated_confirmation_token,
    p_cart_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_delivery_area),
    trim(p_delivery_address),
    nullif(trim(coalesce(p_delivery_notes, '')), ''),
    'cash_on_delivery',
    'pending',
    'placed',
    order_subtotal,
    order_delivery_fee,
    order_total
  )
  returning id into created_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    vendor_id,
    quantity,
    unit_price,
    line_total,
    product_name_en,
    product_name_ar,
    product_slug,
    vendor_name_en,
    vendor_slug
  )
  select
    created_order_id,
    ci.product_id,
    ci.vendor_id,
    ci.quantity,
    ci.unit_price,
    (coalesce(ci.unit_price, 0) * ci.quantity)::numeric(12, 3),
    ci.product_name_en,
    ci.product_name_ar,
    ci.product_slug,
    ci.vendor_name_en,
    ci.vendor_slug
  from public.cart_items ci
  where ci.cart_id = p_cart_id;

  insert into public.vendor_orders (
    order_id,
    vendor_id,
    vendor_subtotal,
    status
  )
  select
    created_order_id,
    ci.vendor_id,
    sum(coalesce(ci.unit_price, 0) * ci.quantity)::numeric(12, 3),
    'placed'
  from public.cart_items ci
  where ci.cart_id = p_cart_id
  group by ci.vendor_id;

  delete from public.cart_items
  where cart_id = p_cart_id;

  update public.carts
  set status = 'abandoned'
  where id = p_cart_id;

  return query select generated_order_number, generated_confirmation_token;
end;
$$;

revoke all on function public.create_cod_order_from_cart(uuid, text, text, text, text, text, text)
from public, anon, authenticated;

grant execute on function public.create_cod_order_from_cart(uuid, text, text, text, text, text, text)
to service_role;
