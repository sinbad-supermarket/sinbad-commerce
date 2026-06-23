import Link from "next/link";
import { formatCartMoney } from "@/components/cart/cart-summary";
import type { OrderItemRow } from "@/features/orders/types";

type OrderItemsTableProps = {
  items: OrderItemRow[];
};

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  if (items.length === 0) {
    return <p className="empty-state">No order items were found.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Vendor</th>
            <th>Quantity</th>
            <th>Unit price</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/products/${item.product_slug}`}>{item.product_name_en}</Link>
                <div className="field-help" dir="rtl">
                  {item.product_name_ar}
                </div>
              </td>
              <td>
                <Link href={`/store/${item.vendor_slug}`}>{item.vendor_name_en}</Link>
              </td>
              <td>{item.quantity}</td>
              <td>{formatCartMoney(item.unit_price)}</td>
              <td>{formatCartMoney(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
