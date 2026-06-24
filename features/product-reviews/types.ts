import type { ProductStatus } from "@/features/products/types";
import type {
  ProductReviewSubmissionRow,
  ProductSubmissionSnapshot,
  SubmissionChangeType,
  SubmissionStatus,
} from "@/features/vendor-submissions/types";

export type ReviewVendorSummary = {
  id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  status: string;
  is_public: boolean;
};

export type ReviewCanonicalProduct = {
  id: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  name_en: string;
  name_ar: string;
  short_description_en: string | null;
  short_description_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
  sale_price: string | number | null;
  brand_name: string | null;
  video_url: string | null;
  stock_quantity: number | null;
  availability: string | null;
  specifications: Array<{ key: string; value: string }> | null;
  warranty: string | null;
  status: ProductStatus;
  review_status: string;
  updated_at: string;
};

export type ProductReviewListItem = {
  id: string;
  vendor_id: string;
  product_id: string | null;
  submitted_by: string;
  change_type: SubmissionChangeType;
  status: SubmissionStatus;
  snapshot: ProductSubmissionSnapshot;
  submitted_at: string | null;
  updated_at: string;
  vendor: ReviewVendorSummary | null;
};

export type ProductReviewDetail = ProductReviewSubmissionRow & {
  vendor: ReviewVendorSummary | null;
  canonicalProduct: ReviewCanonicalProduct | null;
};
