import Link from "next/link";
import { listSubmittedProductReviews } from "@/features/product-reviews/queries";

function formatDate(value: string | null) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminProductReviewsPage() {
  const reviews = await listSubmittedProductReviews();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Reviews</h1>
          <p className="page-copy">Review submitted vendor product snapshots.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="empty-state">No product submissions are awaiting review.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Submitted by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.snapshot.product.name_en}</strong>
                    <br />
                    <span className="arabic-text" dir="rtl">
                      {review.snapshot.product.name_ar}
                    </span>
                  </td>
                  <td>{review.vendor?.name_en ?? "Unknown vendor"}</td>
                  <td>{review.change_type}</td>
                  <td>{formatDate(review.submitted_at)}</td>
                  <td>{review.submitted_by}</td>
                  <td>
                    <Link href={`/admin/product-reviews/${review.id}`}>Review</Link>
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
