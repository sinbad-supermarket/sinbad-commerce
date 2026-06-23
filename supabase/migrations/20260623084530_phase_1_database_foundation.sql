create extension if not exists pgcrypto;

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_role_check check (role in ('owner', 'admin', 'editor')),
  constraint admin_users_user_id_key unique (user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_key unique (slug),
  constraint categories_no_self_parent check (parent_id is null or parent_id <> id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  sku text,
  barcode text,
  name_en text not null,
  name_ar text not null,
  short_description_en text,
  short_description_ar text,
  description_en text,
  description_ar text,
  price numeric(12, 3),
  status text not null default 'draft',
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint products_slug_key unique (slug),
  constraint products_sku_key unique (sku),
  constraint products_barcode_key unique (barcode),
  constraint products_status_check check (status in ('draft', 'active', 'archived')),
  constraint products_price_check check (price is null or price >= 0)
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text_en text,
  alt_text_ar text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  width integer,
  height integer,
  file_size integer,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_storage_path_key unique (storage_path),
  constraint product_images_width_check check (width is null or width > 0),
  constraint product_images_height_check check (height is null or height > 0),
  constraint product_images_file_size_check check (file_size is null or file_size > 0)
);

create index admin_users_user_id_idx on public.admin_users (user_id);
create index categories_is_active_idx on public.categories (is_active);
create index categories_parent_id_idx on public.categories (parent_id);
create index categories_sort_order_idx on public.categories (sort_order);
create index products_status_idx on public.products (status);
create index products_published_at_idx on public.products (published_at);
create index product_categories_category_id_idx on public.product_categories (category_id);
create index product_categories_product_id_idx on public.product_categories (product_id);
create index product_categories_primary_idx on public.product_categories (product_id, is_primary);
create unique index product_categories_one_primary_per_product_idx
  on public.product_categories (product_id)
  where is_primary;
create index product_images_product_id_sort_order_idx
  on public.product_images (product_id, sort_order);
create index product_images_product_id_idx on public.product_images (product_id);
create unique index product_images_one_primary_per_product_idx
  on public.product_images (product_id)
  where is_primary;
create index products_search_vector_idx
  on public.products
  using gin (search_vector);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_product_images_updated_at
before update on public.product_images
for each row
execute function public.set_updated_at();

create or replace function public.refresh_product_search_vector(p_product_id uuid)
returns void
language plpgsql
as $$
begin
  update public.products p
  set search_vector =
    setweight(to_tsvector('simple', coalesce(p.name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.sku, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.barcode, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.short_description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p.short_description_ar, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category_text.category_names, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p.description_en, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p.description_ar, '')), 'C')
  from (
    select
      pc.product_id,
      string_agg(c.name_en || ' ' || c.name_ar, ' ') as category_names
    from public.product_categories pc
    join public.categories c on c.id = pc.category_id
    where pc.product_id = p_product_id
    group by pc.product_id
  ) category_text
  where p.id = p_product_id
    and p.id = category_text.product_id;

  update public.products p
  set search_vector =
    setweight(to_tsvector('simple', coalesce(p.name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.sku, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.barcode, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.short_description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p.short_description_ar, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p.description_en, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p.description_ar, '')), 'C')
  where p.id = p_product_id
    and not exists (
      select 1
      from public.product_categories pc
      where pc.product_id = p_product_id
    );
end;
$$;

create or replace function public.refresh_product_search_vector_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_product_search_vector(new.id);
  return new;
end;
$$;

create trigger refresh_products_search_vector
after insert or update of
  sku,
  barcode,
  name_en,
  name_ar,
  short_description_en,
  short_description_ar,
  description_en,
  description_ar
on public.products
for each row
execute function public.refresh_product_search_vector_trigger();

create or replace function public.refresh_product_search_vector_from_categories_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_product_search_vector(old.product_id);
    return old;
  end if;

  perform public.refresh_product_search_vector(new.product_id);
  return new;
end;
$$;

create trigger refresh_products_search_vector_from_product_categories
after insert or update or delete on public.product_categories
for each row
execute function public.refresh_product_search_vector_from_categories_trigger();

create or replace function public.refresh_product_search_vector_from_category_names_trigger()
returns trigger
language plpgsql
as $$
declare
  related_product_id uuid;
begin
  for related_product_id in
    select pc.product_id
    from public.product_categories pc
    where pc.category_id = new.id
  loop
    perform public.refresh_product_search_vector(related_product_id);
  end loop;

  return new;
end;
$$;

create trigger refresh_products_search_vector_from_category_names
after update of name_en, name_ar on public.categories
for each row
execute function public.refresh_product_search_vector_from_category_names_trigger();

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
