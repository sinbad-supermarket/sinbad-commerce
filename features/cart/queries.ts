import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildCartView,
  getCartIdBySession,
  getExistingCartSessionId,
  listCartItems,
} from "./persistence";
import type { EligibleCartProduct } from "./types";

type EligibleCartProductRow = Omit<EligibleCartProduct, "vendor"> & {
  vendors: EligibleCartProduct["vendor"] | EligibleCartProduct["vendor"][] | null;
};

function firstVendor(row: EligibleCartProductRow) {
  return Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
}

export async function getEligibleCartProduct(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        vendor_id,
        slug,
        name_en,
        name_ar,
        price,
        vendors!inner(id,name_en,slug,status,is_public)
      `,
    )
    .eq("id", productId)
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const product = data as EligibleCartProductRow;
  const vendor = firstVendor(product);

  if (!vendor) {
    return null;
  }

  return {
    ...product,
    vendor,
  };
}

export async function getCurrentCartView() {
  const sessionId = await getExistingCartSessionId();

  if (!sessionId) {
    return buildCartView([]);
  }

  const cartId = await getCartIdBySession(sessionId);

  if (!cartId) {
    return buildCartView([]);
  }

  const items = await listCartItems(cartId);

  return buildCartView(items);
}
