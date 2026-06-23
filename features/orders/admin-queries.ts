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
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (vendorOrdersError) {
    throw new Error(vendorOrdersError.message);
  }

  const typedItems = (items ?? []) as OrderItemRow[];
  const vendorSnapshots = new Map(
    typedItems.map((item) => [
      item.vendor_id,
      {
        vendor_name_en: item.vendor_name_en,
        vendor_slug: item.vendor_slug,
      },
    ]),
  );
  const typedVendorOrders = ((vendorOrders ?? []) as Omit<
    VendorOrderRow,
    "vendor_name_en" | "vendor_slug"
  >[]).map((vendorOrder) => {
    const snapshot = vendorSnapshots.get(vendorOrder.vendor_id);

    return {
      ...vendorOrder,
      vendor_name_en: snapshot?.vendor_name_en ?? vendorOrder.vendor_id,
      vendor_slug: snapshot?.vendor_slug ?? "",
    };
  });

  return {
    ...(order as Omit<AdminOrderDetail, "items" | "vendorOrders">),
    items: typedItems,
    vendorOrders: typedVendorOrders,
  };
}
