create or replace function public.is_canonical_product_field_available(
  p_field text,
  p_value text,
  p_exclude_product_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized_field text := lower(trim(coalesce(p_field, '')));
  normalized_value text := nullif(trim(coalesce(p_value, '')), '');
  matching_product_exists boolean;
begin
  if normalized_field not in ('slug', 'sku', 'barcode') then
    raise exception 'Unsupported product field.';
  end if;

  if normalized_value is null then
    return true;
  end if;

  select exists (
    select 1
    from public.products p
    where (
      (normalized_field = 'slug' and p.slug = normalized_value)
      or (normalized_field = 'sku' and p.sku = normalized_value)
      or (normalized_field = 'barcode' and p.barcode = normalized_value)
    )
      and (p_exclude_product_id is null or p.id <> p_exclude_product_id)
  )
  into matching_product_exists;

  return not matching_product_exists;
end;
$$;

create or replace function public.get_vendor_product_category_assignments(
  p_vendor_id uuid,
  p_product_id uuid
)
returns table (
  category_id uuid,
  is_primary boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select pc.category_id, pc.is_primary
  from public.product_categories pc
  join public.products p on p.id = pc.product_id
  where p.id = p_product_id
    and p.vendor_id = p_vendor_id
    and public.is_active_vendor_member(p_vendor_id)
  order by pc.is_primary desc, pc.created_at asc;
$$;

revoke all on function public.is_canonical_product_field_available(text, text, uuid) from public;
revoke all on function public.get_vendor_product_category_assignments(uuid, uuid) from public;

grant execute on function public.is_canonical_product_field_available(text, text, uuid) to authenticated;
grant execute on function public.get_vendor_product_category_assignments(uuid, uuid) to authenticated;
