import { placeCodOrder } from "@/features/checkout/actions";

type CheckoutFormProps = {
  error?: string;
};

export function CheckoutForm({ error }: CheckoutFormProps) {
  return (
    <form className="checkout-form" action={placeCodOrder}>
      <section className="checkout-panel">
        <h2>Customer</h2>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input name="customer_name" required maxLength={120} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="customer_phone" required maxLength={40} />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="customer_email" type="email" maxLength={254} />
          </label>
        </div>
      </section>

      <section className="checkout-panel">
        <h2>Delivery</h2>
        <div className="form-grid">
          <label className="field">
            <span>Area</span>
            <input name="delivery_area" required maxLength={120} />
          </label>
          <label className="field full-span">
            <span>Address</span>
            <textarea name="delivery_address" required maxLength={500} rows={4} />
          </label>
          <label className="field full-span">
            <span>Notes</span>
            <textarea name="delivery_notes" maxLength={500} rows={3} />
          </label>
        </div>
      </section>

      <section className="checkout-panel">
        <h2>Payment</h2>
        <div className="payment-option">
          <strong>Cash on Delivery</strong>
          <span className="field-help">Payment status will be pending until collection.</span>
        </div>
      </section>

      <button className="primary-button" type="submit">
        Place order
      </button>
    </form>
  );
}
