import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CheckoutFormValues, CreateOrderResult, OrderConfirmation } from "./types";

type CreateOrderRpcRow = {
  order_number: string;
  confirmation_token: string;
};

export async function createCodOrderFromCart(
  cartId: string,
  values: CheckoutFormValues,
): Promise<CreateOrderResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .rpc("create_cod_order_from_cart", {
      p_cart_id: cartId,
      p_customer_name: values.customerName,
      p_customer_phone: values.customerPhone,
      p_customer_email: values.customerEmail,
      p_delivery_area: values.deliveryArea,
      p_delivery_address: values.deliveryAddress,
      p_delivery_notes: values.deliveryNotes,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as CreateOrderRpcRow;

  return {
    orderNumber: row.order_number,
    confirmationToken: row.confirmation_token,
  };
}

export async function getOrderConfirmation(
  orderNumber: string,
  confirmationToken: string,
): Promise<OrderConfirmation | null> {
  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        delivery_area,
        delivery_address,
        delivery_notes,
        payment_method,
        payment_status,
        order_status,
        subtotal,
        delivery_fee,
        total,
        created_at
      `,
    )
    .eq("order_number", orderNumber)
    .eq("confirmation_token", confirmationToken)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("vendor_name_en", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const { data: vendorOrders, error: vendorOrdersError } = await supabase
    .from("vendor_orders")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (vendorOrdersError) {
    throw new Error(vendorOrdersError.message);
  }

  return {
    ...(order as Omit<OrderConfirmation, "items" | "vendorOrders">),
    items: items ?? [],
    vendorOrders: vendorOrders ?? [],
  };
}
