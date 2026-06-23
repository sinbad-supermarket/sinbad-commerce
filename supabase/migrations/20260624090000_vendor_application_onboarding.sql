create table public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'rejected')),
  owner_full_name text not null check (length(trim(owner_full_name)) > 0),
  owner_phone text not null check (length(trim(owner_phone)) > 0),
  owner_email text not null check (length(trim(owner_email)) > 0),
  owner_civil_id_or_passport_number text not null check (length(trim(owner_civil_id_or_passport_number)) > 0),
  owner_civil_id_or_passport_document_path text not null check (length(trim(owner_civil_id_or_passport_document_path)) > 0),
  authorized_signatory_name text,
  authorized_signatory_phone text,
  authorization_document_path text,
  emergency_contact_phone text,
  owner_notes text,
  legal_business_name text not null check (length(trim(legal_business_name)) > 0),
  commercial_license_number text not null check (length(trim(commercial_license_number)) > 0),
  commercial_license_document_path text not null check (length(trim(commercial_license_document_path)) > 0),
  business_address text not null check (length(trim(business_address)) > 0),
  tax_or_vat_number text,
  company_notes text,
  store_name_en text not null check (length(trim(store_name_en)) > 0),
  store_name_ar text not null check (length(trim(store_name_ar)) > 0),
  proposed_store_slug text not null check (length(trim(proposed_store_slug)) > 0),
  store_phone text not null check (length(trim(store_phone)) > 0),
  store_whatsapp text not null check (length(trim(store_whatsapp)) > 0),
  store_order_email text not null check (length(trim(store_order_email)) > 0),
  store_area text not null check (length(trim(store_area)) > 0),
  store_fulfillment_address text not null check (length(trim(store_fulfillment_address)) > 0),
  product_categories_description text not null check (length(trim(product_categories_description)) > 0),
  short_store_description_en text not null check (length(trim(short_store_description_en)) > 0),
  short_store_description_ar text not null check (length(trim(short_store_description_ar)) > 0),
  store_business_hours text,
  expected_daily_order_capacity integer check (expected_daily_order_capacity is null or expected_daily_order_capacity >= 0),
  return_policy_notes text,
  delivery_handled_by text check (delivery_handled_by is null or delivery_handled_by in ('sinbad', 'vendor', 'undecided')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  admin_notes text,
  approved_vendor_id uuid references public.vendors(id),
  vendor_login_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_applications_rejection_reason_required check (
    status <> 'rejected' or length(trim(coalesce(rejection_reason, ''))) > 0
  ),
  constraint vendor_applications_authorization_document_required check (
    nullif(trim(coalesce(authorized_signatory_name, '')), '') is null
    or lower(trim(authorized_signatory_name)) = lower(trim(owner_full_name))
    or nullif(trim(coalesce(authorization_document_path, '')), '') is not null
  )
);

create index vendor_applications_status_idx on public.vendor_applications(status);
create index vendor_applications_created_at_idx on public.vendor_applications(created_at desc);
create index vendor_applications_owner_email_idx on public.vendor_applications(lower(owner_email));
create index vendor_applications_store_slug_idx on public.vendor_applications(proposed_store_slug);
create index vendor_applications_approved_vendor_id_idx on public.vendor_applications(approved_vendor_id);

create trigger set_vendor_applications_updated_at
before update on public.vendor_applications
for each row
execute function public.set_updated_at();

alter table public.vendor_applications enable row level security;

grant select, update on public.vendor_applications to authenticated;
grant select, insert, update on public.vendor_applications to service_role;

create policy "Admins can read vendor applications"
on public.vendor_applications
for select
to authenticated
using (public.is_admin());

create policy "Admins can update vendor applications"
on public.vendor_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vendor-application-documents',
  'vendor-application-documents',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
