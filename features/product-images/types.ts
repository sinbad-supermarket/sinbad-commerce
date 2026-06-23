export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string | null;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImageListItem = ProductImageRow & {
  signedUrl: string | null;
};
