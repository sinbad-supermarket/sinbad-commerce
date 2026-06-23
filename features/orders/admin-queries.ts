import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminOrderDetail, OrderItemRow, OrderListItem, VendorOrderRow } from "./types";

export async function listAdminOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        payment_method,
        payment_status,
        order_status,
        subtotal,
        delivery_fee,
        total,
        created_at
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrderListItem[];
}

export async function getAdminOrderById(id: string) {
  const supabase = await createSupabaseServerClient();
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
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return null;
  }

  const [{ data: items, error: itemsError }, { data: vendorOrders, error: vendorOrdersError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("vendor_name_en", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("vendor_orders")
        .select("*, vendors(name_en, slug)")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (vendorOrdersError) {
    throw new Error(vendorOrdersError.message);
  }

  return {
    ...(order as Omit<AdminOrderDetail, "items" | "vendorOrders">),
    items: (items ?? []) as OrderItemRow[],
    vendorOrders: (vendorOrders ?? []) as VendorOrderRow[],
  };
}
