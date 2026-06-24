import type { ProductReviewDetail } from "@/features/product-reviews/types";

type ProductReviewSummaryProps = {
  review: ProductReviewDetail;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProductReviewSummary({ review }: ProductReviewSummaryProps) {
  const product = review.snapshot.product;

  return (
    <section className="dashboard-card">
      <h2>Submission</h2>
      <p>Vendor: {review.vendor?.name_en ?? "Unknown vendor"}</p>
      <p>Type: {review.change_type}</p>
      <p>Status: {review.status}</p>
      <p>Submitted: {formatDate(review.submitted_at)}</p>
      <p>Submitted by: {review.submitted_by}</p>
      <p>Product: {product.name_en}</p>
      <p dir="rtl">{product.name_ar}</p>
      <p>Brand: {product.brand_name ?? "None"}</p>
      <p>Condition: {product.product_condition ?? "new"}</p>
      <p>Availability: {product.availability}</p>
      <p>Regular price: {product.price ?? "None"} KWD</p>
      <p>Sale price: {product.sale_price ?? "None"} KWD</p>
      <p>Primary image: {review.snapshot.images.find((image) => image.is_primary)?.id ?? "None"}</p>
    </section>
  );
}
