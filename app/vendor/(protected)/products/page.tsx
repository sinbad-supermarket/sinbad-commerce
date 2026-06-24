import Link from "next/link";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { VendorSubmissionStatus } from "@/components/vendor/vendor-submission-status";
import {
  createUpdateSubmissionFromProduct,
} from "@/features/vendor-submissions/actions";
import {
  listVendorCanonicalProducts,
  listVendorSubmissions,
} from "@/features/vendor-submissions/queries";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";

type VendorProductsPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function VendorProductsPage({
  searchParams,
}: VendorProductsPageProps) {
  const { currentVendor, memberships } = await requireSelectedVendor();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [products, submissions] = await Promise.all([
    listVendorCanonicalProducts(currentVendor.vendor.id),
    listVendorSubmissions(currentVendor.vendor.id),
  ]);
  const { error } = resolvedSearchParams;
  const canWrite = currentVendor.vendor.status !== "suspended";

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-copy">
            Add products and track review submissions for this vendor.
          </p>
        </div>
        {canWrite ? (
          <Link className="primary-link" href="/vendor/products/new">
            Add Product
          </Link>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="section-stack">
        <section>
          <div className="section-heading">
            <h3>Canonical products</h3>
          </div>
          {products.length === 0 ? (
            <p className="empty-state">No approved products belong to this vendor yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Review</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const createUpdateSubmission =
                      createUpdateSubmissionFromProduct.bind(null, product.id);

                    return (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name_en}</strong>
                          <br />
                          <span className="arabic-text" dir="rtl">
                            {product.name_ar}
                          </span>
                        </td>
                        <td>{product.status}</td>
                        <td>{product.review_status}</td>
                        <td>{formatDate(product.updated_at)}</td>
                        <td>
                          {canWrite ? (
                            <form action={createUpdateSubmission}>
                              <button className="secondary-button" type="submit">
                                Propose changes
                              </button>
                            </form>
                          ) : (
                            <span className="status-muted">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="section-heading">
            <h3>Review submissions</h3>
          </div>
          {submissions.length === 0 ? (
            <p className="empty-state">No product submissions have been created yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <strong>{submission.snapshot.product.name_en}</strong>
                        <br />
                        <span className="arabic-text" dir="rtl">
                          {submission.snapshot.product.name_ar}
                        </span>
                      </td>
                      <td>{submission.change_type}</td>
                      <td>
                        <VendorSubmissionStatus status={submission.status} />
                      </td>
                      <td>{formatDate(submission.submitted_at)}</td>
                      <td>{formatDate(submission.updated_at)}</td>
                      <td>
                        <Link
                          className="secondary-link"
                          href={`/vendor/products/submissions/${submission.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </VendorShell>
  );
}
