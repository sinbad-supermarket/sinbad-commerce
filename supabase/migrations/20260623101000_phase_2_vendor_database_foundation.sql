create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text,
  slug text not null,
  description_en text,
  description_ar text,
  logo_path text,
  banner_path text,
  status text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_slug_key unique (slug),
  constraint vendors_status_check check (
    status in ('pending', 'active', 'suspended', 'archived')
  )
);

insert into public.vendors (
  name_en,
  name_ar,
  slug,
  status,
  is_public
)
values (
  'Sinbad Commerce Lab',
  'مختبر سندباد التجاري',
  'sinbad-commerce-lab',
  'active',
  true
)
on conflict (slug) do update
set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  status = excluded.status,
  is_public = excluded.is_public;

alter table public.products
add column vendor_id uuid references public.vendors(id),
add column review_status text not null default 'approved',
add column reviewed_at timestamptz,
add column reviewed_by uuid references auth.users(id),
add constraint products_review_status_check check (
  review_status in ('approved', 'pending_review', 'rejected', 'changes_requested')
);

update public.products
set vendor_id = (
  select id
  from public.vendors
  where slug = 'sinbad-commerce-lab'
)
where vendor_id is null;

alter table public.products
alter column vendor_id set not null;

create table public.vendor_users (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_users_vendor_id_user_id_key unique (vendor_id, user_id),
  constraint vendor_users_role_check check (role in ('owner', 'manager', 'editor'))
);

create table public.product_review_submissions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  product_id uuid references public.products(id),
  submitted_by uuid not null references auth.users(id),
  change_type text not null,
  status text not null,
  snapshot jsonb not null,
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_review_submissions_change_type_check check (
    change_type in ('create', 'update')
  ),
  constraint product_review_submissions_status_check check (
    status in (
      'draft',
      'submitted',
      'approved',
      'rejected',
      'changes_requested',
      'cancelled'
    )
  ),
  constraint product_review_submissions_update_requires_product_check check (
    change_type <> 'update' or product_id is not null
  )
);

alter table public.products
add column approved_submission_id uuid references public.product_review_submissions(id);

create index vendors_status_idx on public.vendors (status);
create index vendors_is_public_idx on public.vendors (is_public);
create index vendors_status_is_public_idx on public.vendors (status, is_public);

create index vendor_users_vendor_id_idx on public.vendor_users (vendor_id);
create index vendor_users_user_id_idx on public.vendor_users (user_id);
create index vendor_users_is_active_idx on public.vendor_users (is_active);

create index product_review_submissions_vendor_id_idx
  on public.product_review_submissions (vendor_id);
create index product_review_submissions_product_id_idx
  on public.product_review_submissions (product_id);
create index product_review_submissions_status_idx
  on public.product_review_submissions (status);
create index product_review_submissions_submitted_at_idx
  on public.product_review_submissions (submitted_at);
create index product_review_submissions_vendor_status_idx
  on public.product_review_submissions (vendor_id, status);

create index products_vendor_id_idx on public.products (vendor_id);
create index products_review_status_idx on public.products (review_status);
create index products_vendor_status_review_idx
  on public.products (vendor_id, status, review_status);
create index products_approved_submission_id_idx
  on public.products (approved_submission_id);

create trigger set_vendors_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

create trigger set_vendor_users_updated_at
before update on public.vendor_users
for each row
execute function public.set_updated_at();

create trigger set_product_review_submissions_updated_at
before update on public.product_review_submissions
for each row
execute function public.set_updated_at();

alter table public.vendors enable row level security;
alter table public.vendor_users enable row level security;
alter table public.product_review_submissions enable row level security;
