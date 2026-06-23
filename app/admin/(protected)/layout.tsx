import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/admin">
            Admin
          </Link>
          <nav className="nav" aria-label="Admin navigation">
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/categories">Categories</Link>
            <Link href="/admin/vendors">Vendors</Link>
            <Link href="/admin/product-reviews">Reviews</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/logout">Logout</Link>
          </nav>
        </div>
      </header>
      <main className="shell">{children}</main>
    </>
  );
}
