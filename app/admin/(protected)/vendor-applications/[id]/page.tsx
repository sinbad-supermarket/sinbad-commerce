import { notFound } from "next/navigation";
import { VendorApplicationDetail } from "@/components/admin/vendor-application-detail";
import {
  approveVendorApplication,
  markVendorApplicationUnderReview,
  rejectVendorApplication,
} from "@/features/vendor-applications/actions";
import {
  getVendorApplicationById,
  getVendorApplicationDocuments,
} from "@/features/vendor-applications/queries";
import { requireAdmin } from "@/lib/auth/require-admin";

type AdminVendorApplicationPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminVendorApplicationPage({
  params,
  searchParams,
}: AdminVendorApplicationPageProps) {
  await requireAdmin();
  const { id } = await params;
  const pageParams = await searchParams;
  const application = await getVendorApplicationById(id);

  if (!application) {
    notFound();
  }

  const documents = await getVendorApplicationDocuments(application);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">{application.store_name_en}</h1>
          <p className="page-copy">Review vendor application details and documents.</p>
        </div>
      </header>

      <VendorApplicationDetail
        application={application}
        documents={documents}
        error={pageParams?.error}
        success={pageParams?.success}
        onMarkUnderReview={markVendorApplicationUnderReview.bind(null, id)}
        onApprove={approveVendorApplication.bind(null, id)}
        onReject={rejectVendorApplication.bind(null, id)}
      />
    </div>
  );
}
