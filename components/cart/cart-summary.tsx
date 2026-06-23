import Link from "next/link";

type CartSummaryProps = {
  subtotal: number;
};

export function formatCartMoney(value: string | number | null) {
  if (value === null || value === undefined) {
    return "0.000";
  }

  return Number(value).toFixed(3);
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <aside className="cart-summary" aria-label="Cart summary">
      <h2>Summary</h2>
      <div className="cart-summary-row">
        <span>Subtotal</span>
        <strong>{formatCartMoney(subtotal)}</strong>
      </div>
      <Link className="primary-button" href="/checkout">
        Checkout
      </Link>
      <p className="field-help">Cash on Delivery only. Online payment and shipping integrations are not enabled yet.</p>
    </aside>
  );
}
