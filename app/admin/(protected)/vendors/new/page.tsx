import Link from "next/link";
import { VendorForm } from "@/components/admin/vendor-form";
import { createVendor } from "@/features/vendors/actions";

export default async function NewVendorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Vendor</h1>
          <p className="page-copy">Create a bilingual vendor profile.</p>
        </div>
        <Link className="secondary-link" href="/admin/vendors">
          Back to vendors
        </Link>
      </div>

      <VendorForm action={createVendor} error={error} submitLabel="Create vendor" />
    </>
  );
}
