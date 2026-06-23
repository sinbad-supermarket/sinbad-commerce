import { formatCartMoney } from "@/components/cart/cart-summary";
import { OrderItemsTable } from "@/components/admin/order-items-table";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { VendorOrderSplits } from "@/components/admin/vendor-order-splits";
import type { AdminOrderDetail as AdminOrderDetailType } from "@/features/orders/types";

type AdminOrderDetailProps = {
  error?: string;
  order: AdminOrderDetailType;
  updateOrderStatusAction: (formData: FormData) => void;
  updateVendorOrderStatusAction: (vendorOrderId: string) => (formData: FormData) => void;
};

export function AdminOrderDetail({
  error,
  order,
  updateOrderStatusAction,
  updateVendorOrderStatusAction,
}: AdminOrderDetailProps) {
  return (
    <div className="section-stack">
      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Order</p>
            <h1 className="page-title">{order.order_number}</h1>
          </div>
          <OrderStatusForm
            action={updateOrderStatusAction}
            currentStatus={order.order_status}
            fieldName="order_status"
            label="Order status"
          />
        </div>

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
            <span>Email</span>
            <strong>{order.customer_email ?? "Not provided"}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>{order.payment_method}</strong>
          </div>
          <div>
            <span>Payment status</span>
            <strong>{order.payment_status}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatCartMoney(order.total)}</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="section-title">Delivery</h2>
        <div className="detail-grid">
          <div>
            <span>Area</span>
            <strong>{order.delivery_area}</strong>
          </div>
          <div>
            <span>Address</span>
            <strong>{order.delivery_address}</strong>
          </div>
          <div>
            <span>Notes</span>
            <strong>{order.delivery_notes ?? "None"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="section-title">Totals</h2>
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

      <section className="admin-panel">
        <h2 className="section-title">Order Items</h2>
        <OrderItemsTable items={order.items} />
      </section>

      <section className="admin-panel">
        <h2 className="section-title">Vendor Splits</h2>
        <VendorOrderSplits
          vendorOrders={order.vendorOrders}
          onUpdate={updateVendorOrderStatusAction}
        />
      </section>
    </div>
  );
}
