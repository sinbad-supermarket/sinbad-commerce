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
    cross join search_query sq
    where p.status = 'active'
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
