import { redirect } from "next/navigation";
import Link from "next/link";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { VendorSubmissionForm } from "@/components/vendor/vendor-submission-form";
import { createNewProductSubmission } from "@/features/vendor-submissions/actions";
import { listActiveCategoryOptions } from "@/features/vendor-submissions/queries";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";

export default async function NewVendorProductPage() {
  const { currentVendor, memberships } = await requireSelectedVendor();

  if (currentVendor.vendor.status === "suspended") {
    redirect("/vendor/products?error=Suspended vendors cannot create product drafts.");
  }

  const categories = await listActiveCategoryOptions();

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Add Product</h2>
          <p className="page-copy">
            Add images, product information, pricing, and details. Nothing is
            saved until you choose Save Draft or Submit For Review.
          </p>
        </div>
        <Link className="secondary-link" href="/vendor/products">
          Back to products
        </Link>
      </div>

      <div className="section-stack">
        <VendorSubmissionForm
          action={createNewProductSubmission}
          categories={categories}
          includeNewProductImages
        />

        <div className="submission-actions seller-submit-panel">
          <button
            className="secondary-button"
            form="vendor-product-form"
            name="submission_intent"
            type="submit"
            value="save"
          >
            Save Draft
          </button>
          <button
            className="primary-button"
            form="vendor-product-form"
            name="submission_intent"
            type="submit"
            value="submit"
          >
            Submit For Review
          </button>
        </div>
      </div>
    </VendorShell>
  );
}
