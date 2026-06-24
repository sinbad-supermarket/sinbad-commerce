import type { Metadata } from "next";
import { VendorApplicationForm } from "@/components/vendor-application/vendor-application-form";
import { submitVendorApplication } from "@/features/vendor-applications/actions";

export const metadata: Metadata = {
  title: "Apply to Sell on Sinbad | Sinbad Commerce Lab",
  description: "Submit a vendor application for manual review by Sinbad.",
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
            Apply to sell on Sinbad. Submit your company, owner, store, payout,
            and document details for manual review.
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
