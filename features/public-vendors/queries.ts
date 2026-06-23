import {
  pageInfo,
  paginationRange,
  publicCatalogPageSize,
} from "@/features/public-catalog/pagination";
import { getPublicProductsByIds } from "@/features/public-catalog/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicVendor, PublicVendorProductPage } from "./types";

export async function listPublicVendors() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id,name_en,name_ar,slug,description_en,description_ar,logo_path,banner_path")
    .eq("status", "active")
    .eq("is_public", true)
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PublicVendor[];
}

export async function getPublicVendorBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id,name_en,name_ar,slug,description_en,description_ar,logo_path,banner_path")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PublicVendor | null;
}

export async function listPublicVendorProducts(
  vendorId: string,
  page: number,
): Promise<PublicVendorProductPage> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = paginationRange(page);
  const { data, error, count } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .eq("review_status", "approved")
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const productIds = (data ?? []).map((product) => product.id);
  const products = await getPublicProductsByIds(productIds);
  const totalCount = count ?? 0;

  return {
    ...pageInfo(page, totalCount, publicCatalogPageSize),
    products,
    totalCount,
  };
}
