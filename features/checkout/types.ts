import type { CartView } from "@/features/cart/types";

export type CheckoutFormValues = {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryArea: string;
  deliveryAddress: string;
  deliveryNotes: string | null;
};

export type CheckoutPageData = {
  cart: CartView;
};

export type CreateOrderResult = {
  orderNumber: string;
  confirmationToken: string;
};

export type OrderItemSnapshot = {
  id: string;
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
};

export type VendorOrderSnapshot = {
  id: string;
  vendor_id: string;
  vendor_subtotal: string | number;
  status: string;
};

export type OrderConfirmation = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_area: string;
  delivery_address: string;
  delivery_notes: string | null;
  payment_method: "cash_on_delivery";
  payment_status: "pending";
  order_status: "placed" | "cancelled";
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  created_at: string;
  items: OrderItemSnapshot[];
  vendorOrders: VendorOrderSnapshot[];
};
