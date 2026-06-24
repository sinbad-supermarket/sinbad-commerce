alter table public.products
  add column if not exists sale_price numeric(12, 3),
  add column if not exists brand_name text,
  add column if not exists video_url text,
  add column if not exists stock_quantity integer,
  add column if not exists availability text not null default 'in_stock',
  add column if not exists specifications jsonb not null default '[]'::jsonb,
  add column if not exists warranty text;

alter table public.products
  drop constraint if exists products_sale_price_check,
  drop constraint if exists products_stock_quantity_check,
  drop constraint if exists products_availability_check,
  drop constraint if exists products_specifications_check;

alter table public.products
  add constraint products_sale_price_check
    check (sale_price is null or sale_price >= 0),
  add constraint products_stock_quantity_check
    check (stock_quantity is null or stock_quantity >= 0),
  add constraint products_availability_check
    check (availability in ('in_stock', 'out_of_stock', 'preorder')),
  add constraint products_specifications_check
    check (jsonb_typeof(specifications) = 'array');

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
  raw_sale_price text;
  normalized_price numeric(12, 3);
  normalized_sale_price numeric(12, 3);
  normalized_stock_quantity integer;
  normalized_availability text;
  normalized_specifications jsonb;
  category_ids uuid[];
  primary_category_ids uuid[];
  primary_category_id uuid;
  target_product_id uuid;
  reviewed_user_id uuid := auth.uid();
  image_count integer;
  primary_image_count integer;
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

  if jsonb_typeof(snapshot->'images') <> 'array' then
    raise exception 'Submission snapshot is missing image metadata.';
  end if;

  product_snapshot := snapshot->'product';
  normalized_slug := public.normalize_product_slug(product_snapshot->>'slug');
  normalized_sku := nullif(trim(coalesce(product_snapshot->>'sku', '')), '');
  normalized_barcode := nullif(trim(coalesce(product_snapshot->>'barcode', '')), '');
  intended_status := coalesce(product_snapshot->>'intended_status', 'draft');
  raw_price := nullif(trim(coalesce(product_snapshot->>'price', '')), '');
  raw_sale_price := nullif(trim(coalesce(product_snapshot->>'sale_price', '')), '');
  normalized_availability := coalesce(product_snapshot->>'availability', 'in_stock');

  if nullif(trim(coalesce(product_snapshot->>'name_en', '')), '') is null then
    raise exception 'English product name is required.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'name_ar', '')), '') is null then
    raise exception 'Arabic product name is required.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'short_description_en', '')), '') is null
    or length(trim(product_snapshot->>'short_description_en')) not between 20 and 180 then
    raise exception 'English short description must be 20 to 180 characters.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'short_description_ar', '')), '') is null
    or length(trim(product_snapshot->>'short_description_ar')) not between 20 and 180 then
    raise exception 'Arabic short description must be 20 to 180 characters.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'description_en', '')), '') is null then
    raise exception 'English full description is required.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'description_ar', '')), '') is null then
    raise exception 'Arabic full description is required.';
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

  if normalized_availability not in ('in_stock', 'out_of_stock', 'preorder') then
    raise exception 'Product availability is invalid.';
  end if;

  if nullif(trim(coalesce(product_snapshot->>'video_url', '')), '') is not null
    and (product_snapshot->>'video_url') !~* '^https?://[^[:space:]]+$' then
    raise exception 'Product video URL is invalid.';
  end if;

  if raw_price is null then
    raise exception 'Regular price is required.';
  end if;

  begin
    normalized_price := raw_price::numeric(12, 3);
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'Regular price is invalid.';
  end;

  if normalized_price < 0 then
    raise exception 'Regular price must be non-negative.';
  end if;

  if raw_sale_price is not null then
    begin
      normalized_sale_price := raw_sale_price::numeric(12, 3);
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Sale price is invalid.';
    end;

    if normalized_sale_price < 0 then
      raise exception 'Sale price must be non-negative.';
    end if;

    if normalized_sale_price >= normalized_price then
      raise exception 'Sale price must be less than regular price.';
    end if;
  else
    normalized_sale_price := null;
  end if;

  begin
    normalized_stock_quantity := (product_snapshot->>'stock_quantity')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'Stock quantity is invalid.';
  end;

  if normalized_stock_quantity < 0 then
    raise exception 'Stock quantity must be non-negative.';
  end if;

  normalized_specifications := coalesce(product_snapshot->'specifications', '[]'::jsonb);

  if jsonb_typeof(normalized_specifications) <> 'array'
    or jsonb_array_length(normalized_specifications) > 20 then
    raise exception 'Product specifications are invalid.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(normalized_specifications) as specification
    where nullif(trim(coalesce(specification->>'key', '')), '') is null
      or nullif(trim(coalesce(specification->>'value', '')), '') is null
      or length(trim(specification->>'key')) > 80
      or length(trim(specification->>'value')) > 180
  ) then
    raise exception 'Product specifications are invalid.';
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

  if cardinality(category_ids) = 0 then
    raise exception 'At least one category is required.';
  end if;

  if cardinality(primary_category_ids) <> 1 then
    raise exception 'Exactly one primary category is required.';
  end if;

  primary_category_id := primary_category_ids[1];

  if primary_category_id is not null and not primary_category_id = any(category_ids) then
    raise exception 'Primary category must be one of the assigned categories.';
  end if;

  if exists (
    select 1
    from unnest(category_ids) as category_id
    left join public.categories c on c.id = category_id and c.is_active = true
    where c.id is null
  ) then
    raise exception 'One or more selected categories are unavailable.';
  end if;

  select count(*)
  into image_count
  from jsonb_array_elements(snapshot->'images') as image_item;

  select count(*)
  into primary_image_count
  from jsonb_array_elements(snapshot->'images') as image_item
  where coalesce((image_item->>'is_primary')::boolean, false) = true;

  if image_count < 2 or image_count > 8 then
    raise exception 'Products require 2 to 8 images before approval.';
  end if;

  if primary_image_count <> 1 then
    raise exception 'Exactly one primary image is required.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(snapshot->'images') as image_item
    where nullif(image_item->>'id', '') is null
      or nullif(image_item->>'storage_path', '') is null
      or (image_item->>'mime_type') not in ('image/jpeg', 'image/png', 'image/webp')
      or coalesce((image_item->>'file_size')::integer, 0) <= 0
      or coalesce((image_item->>'file_size')::integer, 0) > 5242880
      or coalesce((image_item->>'sort_order')::integer, 0) <> (image_item->>'sort_order')::integer
      or coalesce((image_item->>'width')::integer, 0) < 330
      or coalesce((image_item->>'height')::integer, 0) < 330
      or coalesce((image_item->>'width')::integer, 0) > 5000
      or coalesce((image_item->>'height')::integer, 0) > 5000
      or (image_item->>'storage_path') !~ (
        '^vendor-submissions/' ||
        submission_record.vendor_id::text ||
        '/' ||
        submission_record.id::text ||
        '/' ||
        (image_item->>'id') ||
        '\.(jpg|png|webp)$'
      )
      or ((image_item->>'id')::uuid)::text <> (image_item->>'id')
      or (
        (image_item->>'mime_type') = 'image/jpeg'
        and (image_item->>'storage_path') !~ '\.jpg$'
      )
      or (
        (image_item->>'mime_type') = 'image/png'
        and (image_item->>'storage_path') !~ '\.png$'
      )
      or (
        (image_item->>'mime_type') = 'image/webp'
        and (image_item->>'storage_path') !~ '\.webp$'
      )
  ) then
    raise exception 'Submission image metadata is invalid.';
  end if;

  if (
    select count(distinct image_item->>'id')
    from jsonb_array_elements(snapshot->'images') as image_item
  ) <> image_count then
    raise exception 'Duplicate staged image IDs are not allowed.';
  end if;

  if (
    select count(distinct image_item->>'storage_path')
    from jsonb_array_elements(snapshot->'images') as image_item
  ) <> image_count then
    raise exception 'Duplicate staged image paths are not allowed.';
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
      sale_price,
      brand_name,
      video_url,
      stock_quantity,
      availability,
      specifications,
      warranty,
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
      normalized_sale_price,
      nullif(trim(coalesce(product_snapshot->>'brand_name', '')), ''),
      nullif(trim(coalesce(product_snapshot->>'video_url', '')), ''),
      normalized_stock_quantity,
      normalized_availability,
      normalized_specifications,
      nullif(trim(coalesce(product_snapshot->>'warranty', '')), ''),
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
      sale_price = normalized_sale_price,
      brand_name = nullif(trim(coalesce(product_snapshot->>'brand_name', '')), ''),
      video_url = nullif(trim(coalesce(product_snapshot->>'video_url', '')), ''),
      stock_quantity = normalized_stock_quantity,
      availability = normalized_availability,
      specifications = normalized_specifications,
      warranty = nullif(trim(coalesce(product_snapshot->>'warranty', '')), ''),
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

  delete from public.product_images
  where product_id = target_product_id;

  insert into public.product_images (
    id,
    product_id,
    storage_path,
    alt_text_en,
    alt_text_ar,
    sort_order,
    is_primary,
    width,
    height,
    file_size,
    mime_type
  )
  select
    (image_item->>'id')::uuid,
    target_product_id,
    image_item->>'storage_path',
    nullif(trim(coalesce(image_item->>'alt_text_en', '')), ''),
    nullif(trim(coalesce(image_item->>'alt_text_ar', '')), ''),
    (image_item->>'sort_order')::integer,
    coalesce((image_item->>'is_primary')::boolean, false),
    (image_item->>'width')::integer,
    (image_item->>'height')::integer,
    (image_item->>'file_size')::integer,
    image_item->>'mime_type'
  from jsonb_array_elements(snapshot->'images') as image_item;

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

revoke all on function public.approve_product_review_submission(uuid) from public;
grant execute on function public.approve_product_review_submission(uuid) to authenticated;
