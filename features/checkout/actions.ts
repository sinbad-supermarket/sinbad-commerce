"use server";

import { redirect } from "next/navigation";
import { getCartIdBySession, getExistingCartSessionId } from "@/features/cart/persistence";
import { createCodOrderFromCart } from "./persistence";
import { parseCheckoutForm } from "./validators";

function checkoutErrorRedirect(message: string): never {
  redirect(`/checkout?error=${encodeURIComponent(message)}`);
}

export async function placeCodOrder(formData: FormData) {
  let redirectPath = "/cart";

  try {
    const values = parseCheckoutForm(formData);
    const sessionId = await getExistingCartSessionId();

    if (!sessionId) {
      throw new Error("Your cart is empty.");
    }

    const cartId = await getCartIdBySession(sessionId);

    if (!cartId) {
      throw new Error("Your cart is empty.");
    }

    const order = await createCodOrderFromCart(cartId, values);

    redirectPath = `/order-confirmation/${order.orderNumber}?token=${encodeURIComponent(
      order.confirmationToken,
    )}`;
  } catch (error) {
    checkoutErrorRedirect(
      error instanceof Error ? error.message : "Unable to place order.",
    );
  }

  redirect(redirectPath);
}
