create or replace function public.replace_product_category_assignments(
  p_product_id uuid,
  p_category_ids uuid[],
  p_primary_category_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_category_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = p_product_id
  ) then
    raise exception 'Product does not exist.';
  end if;

  select coalesce(array_agg(distinct category_id), array[]::uuid[])
  into normalized_category_ids
  from unnest(coalesce(p_category_ids, array[]::uuid[])) as category_id
  where category_id is not null;

  if p_primary_category_id is not null
    and not p_primary_category_id = any(normalized_category_ids) then
    raise exception 'Primary category must be one of the assigned categories.';
  end if;

  if exists (
    select 1
    from unnest(normalized_category_ids) as category_id
    left join public.categories c on c.id = category_id
    where c.id is null
  ) then
    raise exception 'One or more selected categories do not exist.';
  end if;

  delete from public.product_categories
  where product_id = p_product_id;

  insert into public.product_categories (product_id, category_id, is_primary)
  select
    p_product_id,
    category_id,
    category_id = p_primary_category_id
  from unnest(normalized_category_ids) as category_id;
end;
$$;

revoke all on function public.replace_product_category_assignments(uuid, uuid[], uuid) from public;
grant execute on function public.replace_product_category_assignments(uuid, uuid[], uuid) to authenticated;
