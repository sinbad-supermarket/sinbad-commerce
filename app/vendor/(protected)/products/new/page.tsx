import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { VendorSubmissionForm } from "@/components/vendor/vendor-submission-form";
import { createProductSubmissionDraft } from "@/features/vendor-submissions/actions";
import { listActiveCategoryOptions } from "@/features/vendor-submissions/queries";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";

type NewVendorProductPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewVendorProductPage({
  searchParams,
}: NewVendorProductPageProps) {
  const { currentVendor, memberships } = await requireSelectedVendor();

  if (currentVendor.vendor.status === "suspended") {
    redirect("/vendor/products?error=Suspended vendors cannot create product drafts.");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const categories = await listActiveCategoryOptions();
  const { error } = resolvedSearchParams;

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="page-header">
        <div>
          <h2 className="page-title">New product draft</h2>
          <p className="page-copy">
            Create a draft submission. It will not publish until admin approval.
          </p>
        </div>
        <Link className="secondary-link" href="/vendor/products">
          Back to products
        </Link>
      </div>

      <section className="section-stack">
        <div>
          <h2 className="section-title">Product Images</h2>
          <p className="empty-state">
            Save the draft first, then upload 2 to 8 staged product images before
            submitting for review.
          </p>
        </div>
      </section>

      <VendorSubmissionForm
        action={createProductSubmissionDraft}
        categories={categories}
        error={error}
        submitLabel="Save draft"
      />
    </VendorShell>
  );
}
