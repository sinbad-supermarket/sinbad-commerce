import type { Metadata } from "next";
import { CartItemList } from "@/components/cart/cart-item-list";
import { CartSummary } from "@/components/cart/cart-summary";
import { getCurrentCartView } from "@/features/cart/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart | Sinbad Commerce Lab",
  description: "Review products in your cart.",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, cart] = await Promise.all([searchParams, getCurrentCartView()]);

  return (
    <>
      <h1 className="page-title">Cart</h1>
      <p className="page-copy">Review selected products before Cash on Delivery checkout.</p>

      {error ? <p className="form-error">{error}</p> : null}

      {cart.items.length === 0 ? (
        <p className="empty-state">Your cart is empty.</p>
      ) : (
        <div className="cart-layout">
          <CartItemList groups={cart.groups} />
          <CartSummary subtotal={cart.subtotal} />
        </div>
      )}
    </>
  );
}
