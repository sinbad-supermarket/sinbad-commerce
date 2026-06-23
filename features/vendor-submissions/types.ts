import type { ProductStatus } from "@/features/products/types";

export const submissionStatuses = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "changes_requested",
  "cancelled",
] as const;

export const editableSubmissionStatuses = ["draft", "changes_requested"] as const;
export const activeUpdateSubmissionStatuses = [
  "draft",
  "submitted",
  "changes_requested",
] as const;

export type SubmissionStatus = (typeof submissionStatuses)[number];
export type EditableSubmissionStatus = (typeof editableSubmissionStatuses)[number];
export type SubmissionChangeType = "create" | "update";

export type StagedSubmissionImage = {
  id: string;
  storage_path: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  sort_order: number;
  is_primary: boolean;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
};

export type StagedSubmissionImageListItem = StagedSubmissionImage & {
  signedUrl: string | null;
};

export type ProductSubmissionSnapshot = {
  version: 1;
  product: {
    slug: string;
    sku: string | null;
    barcode: string | null;
    name_en: string;
    name_ar: string;
    short_description_en: string | null;
    short_description_ar: string | null;
    description_en: string | null;
    description_ar: string | null;
    price: string | null;
    intended_status: ProductStatus;
  };
  categories: Array<{
    category_id: string;
    is_primary: boolean;
  }>;
  images: StagedSubmissionImage[];
};

export type ProductReviewSubmissionRow = {
  id: string;
  vendor_id: string;
  product_id: string | null;
  submitted_by: string;
  change_type: SubmissionChangeType;
  status: SubmissionStatus;
  snapshot: ProductSubmissionSnapshot;
  admin_notes: string | null;
  reviewed_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorCanonicalProductListItem = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  status: string;
  review_status: string;
  updated_at: string;
};
