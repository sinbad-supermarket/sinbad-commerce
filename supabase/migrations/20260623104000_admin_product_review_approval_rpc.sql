create or replace function public.normalize_product_slug(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    both '-' from regexp_replace(
      regexp_replace(lower(trim(coalesce(p_value, ''))), '[^a-z0-9]+', '-', 'g'),
      '-+',
      '-',
      'g'
    )
  )
$$;

create or replace function public.approve_product_review_submission(
  p_submission_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.product_review_submissions%rowtype;
  snapshot jsonb;
  product_snapshot jsonb;
  normalized_slug text;
  normalized_sku text;
  normalized_barcode text;
  intended_status text;
  raw_price text;
  normalized_price numeric(12, 3);
  category_ids uuid[];
  primary_category_ids uuid[];
  primary_category_id uuid;
  target_product_id uuid;
  reviewed_user_id uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into submission_record
  from public.product_review_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission does not exist.';
  end if;

  if submission_record.status <> 'submitted' then
    raise exception 'Only submitted product reviews can be approved.';
  end if;

  snapshot := submission_record.snapshot;

  if coalesce((snapshot->>'version')::integer, 0) <> 1 then
    raise exception 'Unsupported submission snapshot version.';
  end if;

  if jsonb_typeof(snapshot->'product') <> 'object' then
    raise exception 'Submission snapshot is missing product data.';
  end if;

  if jsonb_typeof(snapshot->'categories') <> 'array' then
    raise exception 'Submission snapshot is missing category assignments.';
  end if;

  if jsonb_typeof(snapshot->'images') <> 'array'
    or jsonb_array_length(snapshot->'images') <> 0 then
    raise exception 'Product images are not supported in this review milestone.';
  end if;

  product_snapshot := snapshot->'product';
  normalized_slug := public.normalize_product_slug(product_snapshot->>'slug');
  normalized_sku := nullif(trim(coalesce(product_snapshot->>'sku', '')), '');
  normalized_barcode := nullif(trim(coalesce(product_snapshot->>'barcode', '')), '');
  intended_status := coalesce(product_snapshot->>'intended_status', 'draft');
  raw_price := nullif(trim(coalesce(product_snapshot->>'price', '')), '');

  if nullif(trim(coalesce(product_snapshot->>'name_en', '')), '') is null then
    raise exception 'English product name is required.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'name_ar', '')), '') is null then
    raise exception 'Arabic product name is required.';
  end if;

  if normalized_slug = '' then
    raise exception 'Product slug is required.';
  end if;

  if normalized_slug <> coalesce(product_snapshot->>'slug', '') then
    raise exception 'Product slug must be normalized before approval.';
  end if;

  if intended_status not in ('draft', 'active', 'archived') then
    raise exception 'Intended product status is invalid.';
  end if;

  if raw_price is not null then
    begin
      normalized_price := raw_price::numeric(12, 3);
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Product price is invalid.';
    end;

    if normalized_price < 0 then
      raise exception 'Product price must be non-negative.';
    end if;
  else
    normalized_price := null;
  end if;

  select coalesce(array_agg(distinct (category_item->>'category_id')::uuid), array[]::uuid[])
  into category_ids
  from jsonb_array_elements(snapshot->'categories') as category_item
  where nullif(category_item->>'category_id', '') is not null;

  select coalesce(array_agg(distinct (category_item->>'category_id')::uuid), array[]::uuid[])
  into primary_category_ids
  from jsonb_array_elements(snapshot->'categories') as category_item
  where coalesce((category_item->>'is_primary')::boolean, false) = true
    and nullif(category_item->>'category_id', '') is not null;

  if intended_status = 'active' and cardinality(category_ids) = 0 then
    raise exception 'Active products require at least one category.';
  end if;

  if cardinality(category_ids) > 0 and cardinality(primary_category_ids) <> 1 then
    raise exception 'Exactly one primary category is required when categories are assigned.';
  end if;

  if cardinality(category_ids) = 0 then
    primary_category_id := null;
  else
    primary_category_id := primary_category_ids[1];
  end if;

  if primary_category_id is not null and not primary_category_id = any(category_ids) then
    raise exception 'Primary category must be one of the assigned categories.';
  end if;

  if exists (
    select 1
    from unnest(category_ids) as category_id
    left join public.categories c on c.id = category_id
    where c.id is null
  ) then
    raise exception 'One or more selected categories do not exist.';
  end if;

  if exists (
    select 1
    from public.products p
    where p.slug = normalized_slug
      and (submission_record.product_id is null or p.id <> submission_record.product_id)
  ) then
    raise exception 'Slug is already in use.';
  end if;

  if normalized_sku is not null and exists (
    select 1
    from public.products p
    where p.sku = normalized_sku
      and (submission_record.product_id is null or p.id <> submission_record.product_id)
  ) then
    raise exception 'SKU is already in use.';
  end if;

  if normalized_barcode is not null and exists (
    select 1
    from public.products p
    where p.barcode = normalized_barcode
      and (submission_record.product_id is null or p.id <> submission_record.product_id)
  ) then
    raise exception 'BARCODE is already in use.';
  end if;

  if submission_record.change_type = 'create' then
    insert into public.products (
      vendor_id,
      slug,
      sku,
      barcode,
      name_en,
      name_ar,
      short_description_en,
      short_description_ar,
      description_en,
      description_ar,
      price,
      status,
      review_status,
      reviewed_by,
      reviewed_at,
      approved_submission_id,
      published_at
    )
    values (
      submission_record.vendor_id,
      normalized_slug,
      normalized_sku,
      normalized_barcode,
      trim(product_snapshot->>'name_en'),
      trim(product_snapshot->>'name_ar'),
      nullif(trim(coalesce(product_snapshot->>'short_description_en', '')), ''),
      nullif(trim(coalesce(product_snapshot->>'short_description_ar', '')), ''),
      nullif(trim(coalesce(product_snapshot->>'description_en', '')), ''),
      nullif(trim(coalesce(product_snapshot->>'description_ar', '')), ''),
      normalized_price,
      intended_status,
      'approved',
      reviewed_user_id,
      now(),
      p_submission_id,
      case when intended_status = 'active' then now() else null end
    )
    returning id into target_product_id;
  elsif submission_record.change_type = 'update' then
    if submission_record.product_id is null then
      raise exception 'Update submissions require a canonical product.';
    end if;

    update public.products p
    set
      slug = normalized_slug,
      sku = normalized_sku,
      barcode = normalized_barcode,
      name_en = trim(product_snapshot->>'name_en'),
      name_ar = trim(product_snapshot->>'name_ar'),
      short_description_en = nullif(trim(coalesce(product_snapshot->>'short_description_en', '')), ''),
      short_description_ar = nullif(trim(coalesce(product_snapshot->>'short_description_ar', '')), ''),
      description_en = nullif(trim(coalesce(product_snapshot->>'description_en', '')), ''),
      description_ar = nullif(trim(coalesce(product_snapshot->>'description_ar', '')), ''),
      price = normalized_price,
      status = intended_status,
      review_status = 'approved',
      reviewed_by = reviewed_user_id,
      reviewed_at = now(),
      approved_submission_id = p_submission_id,
      published_at = case
        when intended_status = 'active' and p.published_at is null then now()
        when intended_status <> 'active' then null
        else p.published_at
      end
    where p.id = submission_record.product_id
      and p.vendor_id = submission_record.vendor_id
    returning p.id into target_product_id;

    if target_product_id is null then
      raise exception 'Canonical product does not belong to this vendor.';
    end if;
  else
    raise exception 'Unsupported submission change type.';
  end if;

  delete from public.product_categories
  where product_id = target_product_id;

  insert into public.product_categories (product_id, category_id, is_primary)
  select
    target_product_id,
    category_id,
    category_id = primary_category_id
  from unnest(category_ids) as category_id;

  update public.product_review_submissions
  set
    product_id = target_product_id,
    status = 'approved',
    reviewed_by = reviewed_user_id,
    reviewed_at = now()
  where id = p_submission_id;

  return target_product_id;
end;
$$;

revoke all on function public.normalize_product_slug(text) from public;
revoke all on function public.approve_product_review_submission(uuid) from public;

grant execute on function public.approve_product_review_submission(uuid) to authenticated;
