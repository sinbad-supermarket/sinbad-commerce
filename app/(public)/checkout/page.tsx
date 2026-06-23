import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderReview } from "@/components/checkout/order-review";
import { getCheckoutPageData } from "@/features/checkout/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | Sinbad Commerce Lab",
  description: "Place a Cash on Delivery order.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { cart }] = await Promise.all([searchParams, getCheckoutPageData()]);

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <p className="page-copy">Cash on Delivery order creation for active cart items.</p>

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link className="primary-button" href="/products">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <CheckoutForm error={error} />
          <OrderReview cart={cart} />
        </div>
      )}
    </>
  );
}
