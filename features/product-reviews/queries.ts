import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ProductReviewDetail,
  ProductReviewListItem,
  ReviewCanonicalProduct,
  ReviewVendorSummary,
} from "./types";
import type { ProductReviewSubmissionRow } from "@/features/vendor-submissions/types";

type VendorJoinRow =
  | ReviewVendorSummary
  | ReviewVendorSummary[]
  | null;

type ReviewSubmissionRow = ProductReviewSubmissionRow & {
  vendors?: VendorJoinRow;
};

function firstVendor(row: ReviewSubmissionRow) {
  return Array.isArray(row.vendors) ? row.vendors[0] : row.vendors ?? null;
}

export async function listSubmittedProductReviews() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_review_submissions")
    .select(
      "id,vendor_id,product_id,submitted_by,change_type,status,snapshot,submitted_at,updated_at,vendors(id,name_en,name_ar,slug,status,is_public)",
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReviewSubmissionRow[]).map<ProductReviewListItem>(
    (row) => ({
      id: row.id,
      vendor_id: row.vendor_id,
      product_id: row.product_id,
      submitted_by: row.submitted_by,
      change_type: row.change_type,
      status: row.status,
      snapshot: row.snapshot,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      vendor: firstVendor(row),
    }),
  );
}

async function getCanonicalProduct(productId: string | null) {
  if (!productId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,sku,barcode,name_en,name_ar,short_description_en,short_description_ar,description_en,description_ar,price,status,review_status,updated_at",
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ReviewCanonicalProduct | null;
}

export async function getProductReviewById(reviewId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_review_submissions")
    .select("*,vendors(id,name_en,name_ar,slug,status,is_public)")
    .eq("id", reviewId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as ReviewSubmissionRow;
  const canonicalProduct = await getCanonicalProduct(row.product_id);

  return {
    ...row,
    vendor: firstVendor(row),
    canonicalProduct,
  } satisfies ProductReviewDetail;
}
