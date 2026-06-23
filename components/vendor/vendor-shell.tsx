import Link from "next/link";
import { vendorStatusMessage } from "@/lib/auth/require-vendor";
import type { CurrentVendorMembership } from "@/lib/auth/vendor";

type VendorShellProps = {
  children: React.ReactNode;
  currentVendor: CurrentVendorMembership;
  memberships: CurrentVendorMembership[];
};

export function VendorShell({
  children,
  currentVendor,
  memberships,
}: VendorShellProps) {
  const warning = vendorStatusMessage(currentVendor);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/vendor">
            Vendor
          </Link>
          <nav className="nav" aria-label="Vendor navigation">
            <Link href="/vendor">Dashboard</Link>
            <Link href="/vendor/products">Products</Link>
            {memberships.length > 1 ? <Link href="/vendor/select">Switch vendor</Link> : null}
            <form action="/vendor/logout" method="post">
              <button type="submit">Logout</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="shell">
        <div className="vendor-context">
          <div>
            <p className="eyebrow">Current vendor</p>
            <h1 className="page-title">{currentVendor.vendor.nameEn}</h1>
            {currentVendor.vendor.nameAr ? (
              <p className="arabic-text" dir="rtl">
                {currentVendor.vendor.nameAr}
              </p>
            ) : null}
          </div>
          <div className="vendor-context-meta">
            <span className="status-muted">Role: {currentVendor.role}</span>
            <span
              className={
                currentVendor.vendor.status === "active"
                  ? "status-active"
                  : "status-muted"
              }
            >
              {currentVendor.vendor.status}
            </span>
          </div>
        </div>

        {warning ? <p className="warning-banner">{warning}</p> : null}

        {children}
      </main>
    </>
  );
}
