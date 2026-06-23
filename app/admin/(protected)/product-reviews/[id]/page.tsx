import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductReviewActions } from "@/components/admin/product-review-actions";
import { ProductReviewComparison } from "@/components/admin/product-review-comparison";
import { ProductReviewImages } from "@/components/admin/product-review-images";
import { ProductReviewSummary } from "@/components/admin/product-review-summary";
import {
  approveProductReview,
  rejectProductReview,
  requestProductReviewChanges,
} from "@/features/product-reviews/actions";
import { getProductReviewById } from "@/features/product-reviews/queries";
import { createStagedSubmissionImageSignedItems } from "@/features/vendor-submissions/images";

type AdminProductReviewDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminProductReviewDetailPage({
  params,
  searchParams,
}: AdminProductReviewDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const review = await getProductReviewById(id);

  if (!review) {
    notFound();
  }

  const approveAction = approveProductReview.bind(null, review.id);
  const rejectAction = rejectProductReview.bind(null, review.id);
  const requestChangesAction = requestProductReviewChanges.bind(null, review.id);
  const signedImages = await createStagedSubmissionImageSignedItems(
    review.snapshot.images,
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Review Product Submission</h1>
          <p className="page-copy">
            Approve, reject, or request changes for this submitted snapshot.
          </p>
        </div>
        <Link className="secondary-link" href="/admin/product-reviews">
          Back to reviews
        </Link>
      </div>

      <div className="section-stack">
        <ProductReviewSummary review={review} />
        <ProductReviewComparison review={review} />
        <ProductReviewImages images={signedImages} />
        <ProductReviewActions
          approveAction={approveAction}
          disabled={review.status !== "submitted"}
          error={resolvedSearchParams.error}
          rejectAction={rejectAction}
          requestChangesAction={requestChangesAction}
        />
      </div>
    </>
  );
}
