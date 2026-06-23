import type { PaginatedProducts } from "@/features/public-catalog/types";

export type PublicVendor = {
  id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  logo_path: string | null;
  banner_path: string | null;
};

export type PublicVendorProductPage = PaginatedProducts;
