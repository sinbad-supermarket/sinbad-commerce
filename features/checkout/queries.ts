import { getCurrentCartView } from "@/features/cart/queries";
import { getOrderConfirmation } from "./persistence";
import { parseConfirmationToken, parseOrderNumber } from "./validators";

export async function getCheckoutPageData() {
  const cart = await getCurrentCartView();

  return { cart };
}

export async function getValidatedOrderConfirmation(orderNumber: string, token: string | undefined) {
  const parsedOrderNumber = parseOrderNumber(orderNumber);
  const parsedToken = parseConfirmationToken(token);

  if (!parsedOrderNumber || !parsedToken) {
    return null;
  }

  return getOrderConfirmation(parsedOrderNumber, parsedToken);
}
