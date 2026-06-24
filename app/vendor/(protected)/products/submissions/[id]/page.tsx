import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { VendorSubmissionImages } from "@/components/vendor/vendor-submission-images";
import { VendorSubmissionForm } from "@/components/vendor/vendor-submission-form";
import {
  deleteSubmissionImage,
  makeSubmissionImagePrimary,
  submitProductSubmissionForReview,
  updateSubmissionImage,
  updateProductSubmissionDraft,
  uploadSubmissionImage,
} from "@/features/vendor-submissions/actions";
import { createStagedSubmissionImageSignedItems } from "@/features/vendor-submissions/images";
import {
  getVendorSubmissionById,
  listActiveCategoryOptions,
} from "@/features/vendor-submissions/queries";
import { editableSubmissionStatuses } from "@/features/vendor-submissions/types";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VendorSubmissionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export default async function VendorSubmissionPage({
  params,
  searchParams,
}: VendorSubmissionPageProps) {
  const [{ id }, { currentVendor, memberships }] = await Promise.all([
    params,
    requireSelectedVendor(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [submission, categories, userId] = await Promise.all([
    getVendorSubmissionById(id, currentVendor.vendor.id),
    listActiveCategoryOptions(),
    getCurrentUserId(),
  ]);
  const { error } = resolvedSearchParams;

  if (!submission) {
    notFound();
  }

  const isEditableStatus = editableSubmissionStatuses.includes(
    submission.status as (typeof editableSubmissionStatuses)[number],
  );
  const canEdit =
    currentVendor.vendor.status !== "suspended" &&
    submission.submitted_by === userId &&
    isEditableStatus;
  const updateSubmission = updateProductSubmissionDraft.bind(null, submission.id);
  const submitSubmission = submitProductSubmissionForReview.bind(null, submission.id);
  const uploadImage = uploadSubmissionImage.bind(null, submission.id);
  const updateImage = (imageId: string) =>
    updateSubmissionImage.bind(null, submission.id, imageId);
  const makePrimaryImage = (imageId: string) =>
    makeSubmissionImagePrimary.bind(null, submission.id, imageId);
  const deleteImage = (imageId: string) =>
    deleteSubmissionImage.bind(null, submission.id, imageId);
  const signedImages = await createStagedSubmissionImageSignedItems(
    submission.snapshot.images,
  );

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Add Product</h2>
          <p className="page-copy">
            Add images, product information, pricing, and details before sending
            this product to Sinbad for review.
          </p>
        </div>
        <Link className="secondary-link" href="/vendor/products">
          Back to products
        </Link>
      </div>

      {submission.admin_notes ? (
        <p className="warning-banner">Admin notes: {submission.admin_notes}</p>
      ) : null}

      <div className="section-stack">
        <VendorSubmissionImages
          canEdit={canEdit}
          images={signedImages}
          onDelete={deleteImage}
          onMakePrimary={makePrimaryImage}
          onUpdate={updateImage}
          uploadAction={uploadImage}
        />

        <VendorSubmissionForm
          action={updateSubmission}
          categories={categories}
          error={error}
          readOnly={!canEdit}
          snapshot={submission.snapshot}
        />

        {canEdit ? (
          <div className="submission-actions seller-submit-panel">
            <button
              className="secondary-button"
              form="vendor-product-form"
              type="submit"
            >
              Save Draft
            </button>
            <form action={submitSubmission}>
              <button className="primary-button" type="submit">
                Submit For Review
              </button>
            </form>
          </div>
        ) : (
          <p className="empty-state">
            This submission is read-only. Submitted, approved, rejected, cancelled,
            or another user&apos;s submissions cannot be edited here.
          </p>
        )}
      </div>
    </VendorShell>
  );
}
