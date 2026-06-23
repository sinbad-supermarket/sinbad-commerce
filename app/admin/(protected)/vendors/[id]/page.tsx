import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorForm } from "@/components/admin/vendor-form";
import { VendorUserForm } from "@/components/admin/vendor-user-form";
import { VendorUserList } from "@/components/admin/vendor-user-list";
import {
  assignVendorUser,
  updateVendor,
  updateVendorUser,
} from "@/features/vendors/actions";
import { getAdminVendorById, listVendorUsers } from "@/features/vendors/queries";

export default async function EditVendorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const [vendor, vendorUsers, { error }] = await Promise.all([
    getAdminVendorById(id),
    listVendorUsers(id),
    searchParams,
  ]);

  if (!vendor) {
    notFound();
  }

  const updateVendorWithId = updateVendor.bind(null, vendor.id);
  const assignVendorUserWithId = assignVendorUser.bind(null, vendor.id);
  const updateVendorUserForVendor = (vendorUserId: string) =>
    updateVendorUser.bind(null, vendor.id, vendorUserId);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Vendor</h1>
          <p className="page-copy">Update profile, visibility, and assigned users.</p>
        </div>
        <Link className="secondary-link" href="/admin/vendors">
          Back to vendors
        </Link>
      </div>

      <section className="section-stack">
        <VendorForm
          action={updateVendorWithId}
          error={error}
          submitLabel="Save vendor"
          vendor={vendor}
        />

        <div className="admin-panel">
          <h2 className="section-title">Vendor Users</h2>
          <VendorUserForm action={assignVendorUserWithId} />
          <VendorUserList users={vendorUsers} onUpdate={updateVendorUserForVendor} />
        </div>
      </section>
    </>
  );
}
