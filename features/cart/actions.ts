"use server";

import { redirect } from "next/navigation";
import {
  addOrIncrementCartItem,
  getCartIdBySession,
  getOrCreateCartId,
  getOrCreateCartSessionId,
  removeCartItemForCart,
  updateCartItemQuantityForCart,
} from "./persistence";
import { getEligibleCartProduct } from "./queries";
import { parseCartQuantity, parseRequiredUuid } from "./validators";

function cartErrorRedirect(message: string): never {
  redirect(`/cart?error=${encodeURIComponent(message)}`);
}

export async function addToCart(productId: string, formData: FormData) {
  let redirectPath = "/cart";

  try {
    const validatedProductId = parseRequiredUuid(productId, "Product");
    const quantity = parseCartQuantity(formData.get("quantity"));
    const product = await getEligibleCartProduct(validatedProductId);

    if (!product) {
      throw new Error("This product is not available for cart.");
    }

    const sessionId = await getOrCreateCartSessionId();
    const cartId = await getOrCreateCartId(sessionId);
    await addOrIncrementCartItem(cartId, {
      product_id: product.id,
      vendor_id: product.vendor_id,
      quantity,
      unit_price: product.price,
      product_name_en: product.name_en,
      product_name_ar: product.name_ar,
      product_slug: product.slug,
      vendor_name_en: product.vendor.name_en,
      vendor_slug: product.vendor.slug,
    });
  } catch (error) {
    redirectPath = `/cart?error=${encodeURIComponent(
      error instanceof Error ? error.message : "Unable to add product to cart.",
    )}`;
  }

  redirect(redirectPath);
}

export async function updateCartItemQuantity(itemId: string, formData: FormData) {
  try {
    const validatedItemId = parseRequiredUuid(itemId, "Cart item");
    const quantity = parseCartQuantity(formData.get("quantity"));
    const sessionId = await getOrCreateCartSessionId();
    const cartId = await getCartIdBySession(sessionId);

    if (!cartId) {
      throw new Error("Cart was not found.");
    }

    await updateCartItemQuantityForCart(cartId, validatedItemId, quantity);
  } catch (error) {
    cartErrorRedirect(
      error instanceof Error ? error.message : "Unable to update cart item.",
    );
  }

  redirect("/cart");
}

export async function removeCartItem(itemId: string) {
  try {
    const validatedItemId = parseRequiredUuid(itemId, "Cart item");
    const sessionId = await getOrCreateCartSessionId();
    const cartId = await getCartIdBySession(sessionId);

    if (!cartId) {
      throw new Error("Cart was not found.");
    }

    await removeCartItemForCart(cartId, validatedItemId);
  } catch (error) {
    cartErrorRedirect(
      error instanceof Error ? error.message : "Unable to remove cart item.",
    );
  }

  redirect("/cart");
}
