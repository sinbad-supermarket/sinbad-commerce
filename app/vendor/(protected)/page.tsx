import { VendorShell } from "@/components/vendor/vendor-shell";
import Link from "next/link";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";

export default async function VendorDashboardPage() {
  const { currentVendor, memberships } = await requireSelectedVendor();
  const visibility =
    currentVendor.vendor.status === "active" && currentVendor.vendor.isPublic
      ? "Public"
      : "Not public";

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Vendor Status</h2>
          <p>Status: {currentVendor.vendor.status}</p>
          <p>Public visibility: {visibility}</p>
          <p>Future store path: /store/{currentVendor.vendor.slug}</p>
        </section>
        <section className="dashboard-card">
          <h2>Products</h2>
          <p className="page-copy">
            Create and track product submissions for admin review.
          </p>
          <Link className="secondary-link" href="/vendor/products">
            Open products
          </Link>
        </section>
      </div>
    </VendorShell>
  );
}
