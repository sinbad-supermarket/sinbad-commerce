import type { Metadata } from "next";
import { VendorApplicationForm } from "@/components/vendor-application/vendor-application-form";
import { submitVendorApplication } from "@/features/vendor-applications/actions";

export const metadata: Metadata = {
  title: "Vendor Application | Sinbad Commerce Lab",
  description: "Apply to become a vendor on Sinbad Commerce Lab.",
};

type VendorApplyPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function VendorApplyPage({ searchParams }: VendorApplyPageProps) {
  const params = await searchParams;

  return (
    <div className="section-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Vendor application</h1>
          <p className="page-copy">
            Submit owner, legal business, and store operations details for admin review.
          </p>
        </div>
      </header>

      <VendorApplicationForm
        action={submitVendorApplication}
        error={params?.error}
        success={params?.success}
      />
    </div>
  );
}
