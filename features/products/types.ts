export const productStatuses = ["draft", "active", "archived"] as const;

export type ProductStatus = (typeof productStatuses)[number];

export type ProductRow = {
  id: string;
  vendor_id: string;
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
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ProductCategoryAssignment = {
  product_id: string;
  category_id: string;
  is_primary: boolean;
};

export type ProductListItem = ProductRow & {
  primaryCategoryName: string | null;
};
