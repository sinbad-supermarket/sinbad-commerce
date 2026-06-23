import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            Sinbad Commerce Lab
          </Link>
          <nav className="nav" aria-label="Public navigation">
            <Link href="/products">Products</Link>
            <Link href="/store">Stores</Link>
            <Link href="/vendors/apply">Apply</Link>
            <Link href="/search">Search</Link>
            <Link href="/cart">Cart</Link>
          </nav>
        </div>
      </header>
      <main className="shell">{children}</main>
    </>
  );
}
