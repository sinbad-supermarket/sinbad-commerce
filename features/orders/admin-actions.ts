"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseOrderStatus } from "./validators";

function orderErrorRedirect(orderId: string, message: string): never {
  redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(message)}`);
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();

  try {
    const orderStatus = parseOrderStatus(formData.get("order_status"));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("orders")
      .update({ order_status: orderStatus })
      .eq("id", orderId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    orderErrorRedirect(
      orderId,
      error instanceof Error ? error.message : "Unable to update order status.",
    );
  }

  redirect(`/admin/orders/${orderId}`);
}

export async function updateVendorOrderStatus(
  orderId: string,
  vendorOrderId: string,
  formData: FormData,
) {
  await requireAdmin();

  try {
    const status = parseOrderStatus(formData.get("status"));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("vendor_orders")
      .update({ status })
      .eq("id", vendorOrderId)
      .eq("order_id", orderId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    orderErrorRedirect(
      orderId,
      error instanceof Error ? error.message : "Unable to update vendor order status.",
    );
  }

  redirect(`/admin/orders/${orderId}`);
}
