import Link from "next/link";
import { formatCartMoney } from "@/components/cart/cart-summary";
import { listAdminOrders } from "@/features/orders/admin-queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listAdminOrders();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Orders</h1>
          <p className="page-copy">Review Cash on Delivery orders and fulfillment status.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="empty-state">No orders have been placed yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Payment status</th>
                <th>Order status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_phone}</td>
                  <td>{formatCartMoney(order.total)}</td>
                  <td>{order.payment_method}</td>
                  <td>{order.payment_status}</td>
                  <td>{order.order_status}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
