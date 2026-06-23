import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderDetail } from "@/components/admin/order-detail";
import {
  updateOrderStatus,
  updateVendorOrderStatus,
} from "@/features/orders/admin-actions";
import { getAdminOrderById } from "@/features/orders/admin-queries";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  const updateOrderStatusWithId = updateOrderStatus.bind(null, order.id);
  const updateVendorOrderStatusForOrder = (vendorOrderId: string) =>
    updateVendorOrderStatus.bind(null, order.id, vendorOrderId);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Detail</h1>
          <p className="page-copy">View customer, delivery, item, and vendor split details.</p>
        </div>
        <Link className="secondary-link" href="/admin/orders">
          Back to orders
        </Link>
      </div>

      <AdminOrderDetail
        error={error}
        order={order}
        updateOrderStatusAction={updateOrderStatusWithId}
        updateVendorOrderStatusAction={updateVendorOrderStatusForOrder}
      />
    </>
  );
}
