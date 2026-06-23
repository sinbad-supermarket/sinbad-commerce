import Link from "next/link";
import type { CartView } from "@/features/cart/types";
import { formatCartMoney } from "@/components/cart/cart-summary";

type OrderReviewProps = {
  cart: CartView;
};

export function OrderReview({ cart }: OrderReviewProps) {
  return (
    <section className="checkout-panel" aria-label="Order review">
      <h2>Review</h2>
      <div className="cart-groups">
        {cart.groups.map((group) => (
          <section className="checkout-vendor-group" key={group.vendorId}>
            <div className="cart-vendor-heading">
              <h3>{group.vendorNameEn}</h3>
              <Link className="muted-link" href={`/store/${group.vendorSlug}`}>
                /store/{group.vendorSlug}
              </Link>
            </div>
            <div className="checkout-items">
              {group.items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div>
                    <Link href={`/products/${item.product_slug}`}>
                      <strong>{item.product_name_en}</strong>
                    </Link>
                    <p className="arabic-text" dir="rtl">
                      {item.product_name_ar}
                    </p>
                  </div>
                  <span>Qty {item.quantity}</span>
                  <strong>
                    {formatCartMoney(
                      item.unit_price === null ? 0 : Number(item.unit_price) * item.quantity,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="cart-summary-row">
        <span>Subtotal</span>
        <strong>{formatCartMoney(cart.subtotal)}</strong>
      </div>
      <div className="cart-summary-row">
        <span>Delivery fee</span>
        <strong>{formatCartMoney(0)}</strong>
      </div>
      <div className="cart-summary-row total-row">
        <span>Total</span>
        <strong>{formatCartMoney(cart.subtotal)}</strong>
      </div>
    </section>
  );
}
