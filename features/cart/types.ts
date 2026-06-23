export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: string | number | null;
  product_name_en: string;
  product_name_ar: string;
  product_slug: string;
  vendor_name_en: string;
  vendor_slug: string;
  created_at: string;
  updated_at: string;
};

export type CartVendorGroup = {
  vendorId: string;
  vendorNameEn: string;
  vendorSlug: string;
  items: CartItem[];
};

export type CartView = {
  groups: CartVendorGroup[];
  items: CartItem[];
  subtotal: number;
};

export type EligibleCartProduct = {
  id: string;
  vendor_id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  price: string | number | null;
  vendor: {
    id: string;
    name_en: string;
    slug: string;
    status: string;
    is_public: boolean;
  };
};
