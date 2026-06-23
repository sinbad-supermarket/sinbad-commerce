export type PublicCategory = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  parent_id: string | null;
  sort_order: number;
};

export type PublicImage = {
  id: string;
  storage_path: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  sort_order: number;
  is_primary: boolean;
  signedUrl: string | null;
};

export type PublicProduct = {
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
  primaryCategory: PublicCategory | null;
  primaryImage: PublicImage | null;
  categories: PublicCategory[];
};

export type PaginatedProducts = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  products: PublicProduct[];
  totalCount: number;
  totalPages: number;
};
