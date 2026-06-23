import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CartItem, CartView } from "./types";

export const cartSessionCookieName = "cart_session_id";

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value),
  );
}

export async function getExistingCartSessionId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(cartSessionCookieName)?.value;

  return isUuid(sessionId) ? sessionId : null;
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(cartSessionCookieName)?.value;

  if (isUuid(existingSessionId)) {
    return existingSessionId;
  }

  const sessionId = randomUUID();
  cookieStore.set(cartSessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return sessionId;
}

export async function getCartIdBySession(sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id as string | undefined;
}

export async function getOrCreateCartId(sessionId: string) {
  const existingCartId = await getCartIdBySession(sessionId);

  if (existingCartId) {
    return existingCartId;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .insert({ session_id: sessionId })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function listCartItems(cartId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .order("vendor_name_en", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CartItem[];
}

export async function addOrIncrementCartItem(
  cartId: string,
  item: {
    product_id: string;
    vendor_id: string;
    quantity: number;
    unit_price: string | number | null;
    product_name_en: string;
    product_name_ar: string;
    product_slug: string;
    vendor_name_en: string;
    vendor_slug: string;
  },
) {
  const supabase = createSupabaseAdminClient();
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("cart_id", cartId)
    .eq("product_id", item.product_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingItem) {
    const nextQuantity = Math.min(existingItem.quantity + item.quantity, 99);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existingItem.id)
      .eq("cart_id", cartId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    cart_id: cartId,
    ...item,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCartItemQuantityForCart(
  cartId: string,
  itemId: string,
  quantity: number,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("cart_id", cartId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeCartItemForCart(cartId: string, itemId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cartId);

  if (error) {
    throw new Error(error.message);
  }
}

export function buildCartView(items: CartItem[]): CartView {
  const groupsByVendor = new Map<string, CartView["groups"][number]>();
  const subtotal = items.reduce((total, item) => {
    const unitPrice = item.unit_price === null ? 0 : Number(item.unit_price);
    return total + unitPrice * item.quantity;
  }, 0);

  items.forEach((item) => {
    const group = groupsByVendor.get(item.vendor_id) ?? {
      vendorId: item.vendor_id,
      vendorNameEn: item.vendor_name_en,
      vendorSlug: item.vendor_slug,
      items: [],
    };

    group.items.push(item);
    groupsByVendor.set(item.vendor_id, group);
  });

  return {
    groups: Array.from(groupsByVendor.values()),
    items,
    subtotal,
  };
}
