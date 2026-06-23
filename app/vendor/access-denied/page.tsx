import Link from "next/link";

export default function VendorAccessDeniedPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="vendor-access-title">
        <h1 id="vendor-access-title" className="page-title">
          Vendor Access Required
        </h1>
        <p className="page-copy">
          This account is not assigned to an active vendor membership.
        </p>
        <Link className="primary-link" href="/vendor/login">
          Back to vendor login
        </Link>
      </section>
    </main>
  );
}
