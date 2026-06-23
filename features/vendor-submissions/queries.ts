import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/features/categories/types";
import type {
  ProductReviewSubmissionRow,
  VendorCanonicalProductListItem,
} from "./types";

type CanonicalProductRow = VendorCanonicalProductListItem & {
  sku: string | null;
  barcode: string | null;
  short_description_en: string | null;
  short_description_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
  vendor_id: string;
};

export async function listVendorCanonicalProducts(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name_en,name_ar,status,review_status,updated_at")
    .eq("vendor_id", vendorId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VendorCanonicalProductListItem[];
}

export async function getVendorCanonicalProductById(
  productId: string,
  vendorId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,sku,barcode,name_en,name_ar,short_description_en,short_description_ar,description_en,description_ar,price,status,review_status,updated_at,vendor_id",
    )
    .eq("id", productId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CanonicalProductRow | null;
}

export async function listVendorSubmissions(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_review_submissions")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductReviewSubmissionRow[];
}

export async function getVendorSubmissionById(
  submissionId: string,
  vendorId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_review_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProductReviewSubmissionRow | null;
}

export async function listVendorProductCategoryAssignments(
  productId: string,
  vendorId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .rpc("get_vendor_product_category_assignments", {
      p_product_id: productId,
      p_vendor_id: vendorId,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{ category_id: string; is_primary: boolean }>;
}

export async function listActiveCategoryOptions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}
