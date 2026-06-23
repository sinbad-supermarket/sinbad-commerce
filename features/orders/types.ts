export const orderStatuses = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderListItem = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  payment_method: string;
  payment_status: string;
  order_status: OrderStatus;
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: string | number | null;
  line_total: string | number | null;
  product_name_en: string;
  product_name_ar: string;
  product_slug: string;
  vendor_name_en: string;
  vendor_slug: string;
  created_at: string;
};

export type VendorOrderRow = {
  id: string;
  order_id: string;
  vendor_id: string;
  vendor_subtotal: string | number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  vendor_name_en: string;
  vendor_slug: string;
};

export type AdminOrderDetail = OrderListItem & {
  delivery_area: string;
  delivery_address: string;
  delivery_notes: string | null;
  items: OrderItemRow[];
  vendorOrders: VendorOrderRow[];
};
