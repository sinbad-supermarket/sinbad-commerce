import Link from "next/link";
import { listAdminVendors } from "@/features/vendors/queries";

function visibilityLabel(status: string, isPublic: boolean) {
  if (status !== "active") {
    return "Hidden";
  }

  return isPublic ? "Public" : "Private";
}

export default async function AdminVendorsPage() {
  const vendors = await listAdminVendors();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Vendors</h1>
          <p className="page-copy">Manage vendor profiles and user assignments.</p>
        </div>
        <Link className="primary-link" href="/admin/vendors/new">
          New vendor
        </Link>
      </div>

      {vendors.length === 0 ? (
        <p className="empty-state">No vendors have been created yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>English name</th>
                <th>Arabic name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Store URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.name_en}</td>
                  <td dir="rtl">{vendor.name_ar ?? ""}</td>
                  <td>{vendor.slug}</td>
                  <td>
                    <span
                      className={vendor.status === "active" ? "status-active" : "status-muted"}
                    >
                      {vendor.status}
                    </span>
                  </td>
                  <td>{visibilityLabel(vendor.status, vendor.is_public)}</td>
                  <td>/store/{vendor.slug}</td>
                  <td>
                    <Link href={`/admin/vendors/${vendor.id}`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
