create or replace function public.current_vendor_role(p_vendor_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select vu.role
  from public.vendor_users vu
  where vu.vendor_id = p_vendor_id
    and vu.user_id = auth.uid()
    and vu.is_active = true
  limit 1
$$;

create or replace function public.is_active_vendor_member(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_vendor_role(p_vendor_id) in ('owner', 'manager', 'editor')
$$;

create or replace function public.is_vendor_owner_or_manager(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_vendor_role(p_vendor_id) in ('owner', 'manager')
$$;

revoke all on function public.current_vendor_role(uuid) from public;
revoke all on function public.is_active_vendor_member(uuid) from public;
revoke all on function public.is_vendor_owner_or_manager(uuid) from public;
grant execute on function public.current_vendor_role(uuid) to authenticated;
grant execute on function public.is_active_vendor_member(uuid) to authenticated;
grant execute on function public.is_vendor_owner_or_manager(uuid) to authenticated;

grant select on public.vendors to anon, authenticated;
grant insert, update on public.vendors to authenticated;
grant select, insert, update on public.vendor_users to authenticated;
grant select, insert, update on public.product_review_submissions to authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active approved public vendor products"
on public.products
for select
to anon, authenticated
using (
  status = 'active'
  and review_status = 'approved'
  and exists (
    select 1
    from public.vendors v
    where v.id = products.vendor_id
      and v.status = 'active'
      and v.is_public = true
  )
);

create policy "Vendor members can read own products"
on public.products
for select
to authenticated
using (public.is_active_vendor_member(vendor_id));

drop policy if exists "Public can read active product categories" on public.product_categories;
create policy "Public can read active approved public vendor product categories"
on public.product_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    join public.categories c on c.id = product_categories.category_id
    join public.vendors v on v.id = p.vendor_id
    where p.id = product_categories.product_id
      and p.status = 'active'
      and p.review_status = 'approved'
      and c.is_active = true
      and v.status = 'active'
      and v.is_public = true
  )
);

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active approved public vendor product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = product_images.product_id
      and p.status = 'active'
      and p.review_status = 'approved'
      and v.status = 'active'
      and v.is_public = true
  )
);

create policy "Public can read active public vendors"
on public.vendors
for select
to anon, authenticated
using (
  status = 'active'
  and is_public = true
);

create policy "Vendor members can read own vendor"
on public.vendors
for select
to authenticated
using (public.is_active_vendor_member(id));

create policy "Admins can read vendors"
on public.vendors
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert vendors"
on public.vendors
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update vendors"
on public.vendors
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read own active vendor membership"
on public.vendor_users
for select
to authenticated
using (
  user_id = auth.uid()
  and is_active = true
);

create policy "Vendor owners and managers can read vendor memberships"
on public.vendor_users
for select
to authenticated
using (public.is_vendor_owner_or_manager(vendor_id));

create policy "Admins can read vendor users"
on public.vendor_users
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert vendor users"
on public.vendor_users
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update vendor users"
on public.vendor_users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Vendor members can read own vendor submissions"
on public.product_review_submissions
for select
to authenticated
using (public.is_active_vendor_member(vendor_id));

create policy "Vendor members can insert own vendor submissions"
on public.product_review_submissions
for insert
to authenticated
with check (
  public.is_active_vendor_member(vendor_id)
  and submitted_by = auth.uid()
  and status in ('draft', 'submitted')
);

create policy "Vendor members can update editable own vendor submissions"
on public.product_review_submissions
for update
to authenticated
using (
  public.is_active_vendor_member(vendor_id)
  and status in ('draft', 'changes_requested')
)
with check (
  public.is_active_vendor_member(vendor_id)
  and submitted_by = auth.uid()
  and status in ('draft', 'submitted')
);

create policy "Admins can read product review submissions"
on public.product_review_submissions
for select
to authenticated
using (public.is_admin());

create policy "Admins can update product review submissions"
on public.product_review_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.search_active_products(
  p_query text,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  product_id uuid,
  rank_score double precision,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with normalized as (
    select left(trim(coalesce(p_query, '')), 100) as query_text
  ),
  search_query as (
    select
      query_text,
      lower(query_text) as query_lower,
      websearch_to_tsquery('simple', query_text) as ts_query
    from normalized
    where query_text <> ''
  ),
  matches as (
    select
      p.id as product_id,
      case
        when lower(coalesce(p.sku, '')) = sq.query_lower then 1000::double precision
        when lower(coalesce(p.barcode, '')) = sq.query_lower then 900::double precision
        else ts_rank_cd(coalesce(p.search_vector, ''::tsvector), sq.ts_query)::double precision
      end as rank_score
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    cross join search_query sq
    where p.status = 'active'
      and p.review_status = 'approved'
      and v.status = 'active'
      and v.is_public = true
      and (
        lower(coalesce(p.sku, '')) = sq.query_lower
        or lower(coalesce(p.barcode, '')) = sq.query_lower
        or coalesce(p.search_vector, ''::tsvector) @@ sq.ts_query
      )
  )
  select
    matches.product_id,
    matches.rank_score,
    count(*) over () as total_count
  from matches
  order by
    matches.rank_score desc,
    matches.product_id
  limit greatest(0, least(coalesce(p_limit, 12), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.search_active_products(text, integer, integer) from public;
grant execute on function public.search_active_products(text, integer, integer) to anon, authenticated;
