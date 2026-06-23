import Link from "next/link";
import { formatCartMoney } from "@/components/cart/cart-summary";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import type { VendorOrderRow } from "@/features/orders/types";

type VendorOrderSplitsProps = {
  vendorOrders: VendorOrderRow[];
  onUpdate: (vendorOrderId: string) => (formData: FormData) => void;
};

export function VendorOrderSplits({ vendorOrders, onUpdate }: VendorOrderSplitsProps) {
  if (vendorOrders.length === 0) {
    return <p className="empty-state">No vendor splits were found.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Subtotal</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {vendorOrders.map((vendorOrder) => (
            <tr key={vendorOrder.id}>
              <td>
                {vendorOrder.vendor_slug ? (
                  <Link href={`/store/${vendorOrder.vendor_slug}`}>
                    {vendorOrder.vendor_name_en}
                  </Link>
                ) : (
                  vendorOrder.vendor_name_en
                )}
              </td>
              <td>{formatCartMoney(vendorOrder.vendor_subtotal)}</td>
              <td>{vendorOrder.status}</td>
              <td>
                <OrderStatusForm
                  action={onUpdate(vendorOrder.id)}
                  currentStatus={vendorOrder.status}
                  fieldName="status"
                  label="Vendor status"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
