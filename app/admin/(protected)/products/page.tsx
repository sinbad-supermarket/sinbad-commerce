import Link from "next/link";
import { listAdminProducts } from "@/features/products/queries";

function formatPrice(price: string | number | null) {
  if (price === null || price === undefined) {
    return "Not set";
  }

  return Number(price).toFixed(3);
}

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Products</h1>
          <p className="page-copy">Manage bilingual catalog products.</p>
        </div>
        <Link className="primary-link" href="/admin/products/new">
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="empty-state">No products have been created yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>English name</th>
                <th>Arabic name</th>
                <th>Slug</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Price</th>
                <th>Status</th>
                <th>Primary category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name_en}</td>
                  <td dir="rtl">{product.name_ar}</td>
                  <td>{product.slug}</td>
                  <td>{product.sku ?? "None"}</td>
                  <td>{product.barcode ?? "None"}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <span
                      className={
                        product.status === "active" ? "status-active" : "status-muted"
                      }
                    >
                      {product.status}
                    </span>
                  </td>
                  <td>{product.primaryCategoryName ?? "None"}</td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                      <Link href={`/admin/products/${product.id}/images`}>Images</Link>
                    </div>
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
