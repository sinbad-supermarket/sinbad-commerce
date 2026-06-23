import Link from "next/link";
import { formatCartMoney } from "@/components/cart/cart-summary";
import type { OrderConfirmation } from "@/features/checkout/types";

type OrderConfirmationSummaryProps = {
  order: OrderConfirmation;
};

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps) {
  return (
    <div className="confirmation-layout">
      <section className="checkout-panel">
        <p className="eyebrow">Order placed</p>
        <h1 className="page-title">{order.order_number}</h1>
        <p className="page-copy">
          Cash on Delivery is selected. Payment status is {order.payment_status}.
        </p>
        <div className="detail-grid">
          <div>
            <span>Customer</span>
            <strong>{order.customer_name}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{order.customer_phone}</strong>
          </div>
          <div>
            <span>Area</span>
            <strong>{order.delivery_area}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{order.order_status}</strong>
          </div>
        </div>
        <p>{order.delivery_address}</p>
        {order.delivery_notes ? <p className="field-help">{order.delivery_notes}</p> : null}
      </section>

      <section className="checkout-panel">
        <h2>Items</h2>
        <div className="checkout-items">
          {order.items.map((item) => (
            <div className="checkout-item" key={item.id}>
              <div>
                <Link href={`/products/${item.product_slug}`}>
                  <strong>{item.product_name_en}</strong>
                </Link>
                <p className="field-help">{item.vendor_name_en}</p>
              </div>
              <span>Qty {item.quantity}</span>
              <strong>{formatCartMoney(item.line_total)}</strong>
            </div>
          ))}
        </div>
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <strong>{formatCartMoney(order.subtotal)}</strong>
        </div>
        <div className="cart-summary-row">
          <span>Delivery fee</span>
          <strong>{formatCartMoney(order.delivery_fee)}</strong>
        </div>
        <div className="cart-summary-row total-row">
          <span>Total</span>
          <strong>{formatCartMoney(order.total)}</strong>
        </div>
      </section>
    </div>
  );
}
