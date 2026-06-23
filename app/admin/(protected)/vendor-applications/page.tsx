import { VendorApplicationList } from "@/components/admin/vendor-application-list";
import { listVendorApplications } from "@/features/vendor-applications/queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminVendorApplicationsPage() {
  await requireAdmin();
  const applications = await listVendorApplications();

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Vendor applications</h1>
          <p className="page-copy">
            Review submitted vendor onboarding requests and keep private owner/legal data
            inside the admin workflow.
          </p>
        </div>
      </header>

      <VendorApplicationList applications={applications} />
    </div>
  );
}
