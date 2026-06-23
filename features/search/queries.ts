import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  pageInfo,
  paginationRange,
  publicCatalogPageSize,
} from "@/features/public-catalog/pagination";
import { getPublicProductsByIds } from "@/features/public-catalog/queries";
import type { SearchResults } from "./types";

type SearchRow = {
  product_id: string;
  rank_score: number;
  total_count: number;
};

export async function searchPublicProducts(
  query: string,
  page: number,
): Promise<SearchResults> {
  if (!query) {
    return {
      ...pageInfo(1, 0, publicCatalogPageSize),
      products: [],
      query,
      totalCount: 0,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { from } = paginationRange(page);
  const { data, error } = await supabase.rpc("search_active_products", {
    p_query: query,
    p_limit: publicCatalogPageSize,
    p_offset: from,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SearchRow[];
  const productIds = rows.map((row) => row.product_id);
  const products = await getPublicProductsByIds(productIds);
  const totalCount = rows[0]?.total_count ?? 0;

  return {
    ...pageInfo(page, totalCount, publicCatalogPageSize),
    products,
    query,
    totalCount,
  };
}
