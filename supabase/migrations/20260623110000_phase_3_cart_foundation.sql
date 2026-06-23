create table public.carts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  status text not null default 'active' check (status in ('active', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  vendor_id uuid not null references public.vendors(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 3),
  product_name_en text not null,
  product_name_ar text not null,
  product_slug text not null,
  vendor_name_en text not null,
  vendor_slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index cart_items_product_id_idx on public.cart_items(product_id);
create index cart_items_vendor_id_idx on public.cart_items(vendor_id);
create index carts_status_idx on public.carts(status);

create trigger set_carts_updated_at
before update on public.carts
for each row
execute function public.set_updated_at();

create trigger set_cart_items_updated_at
before update on public.cart_items
for each row
execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
