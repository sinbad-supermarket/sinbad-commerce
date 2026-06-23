import Link from "next/link";
import type { VendorApplicationRow } from "@/features/vendor-applications/types";

type VendorApplicationListProps = {
  applications: Pick<
    VendorApplicationRow,
    | "id"
    | "status"
    | "owner_full_name"
    | "owner_email"
    | "legal_business_name"
    | "store_name_en"
    | "store_name_ar"
    | "proposed_store_slug"
    | "reviewed_at"
    | "created_at"
  >[];
};

export function VendorApplicationList({ applications }: VendorApplicationListProps) {
  if (applications.length === 0) {
    return <p className="empty-state">No vendor applications have been submitted yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Owner</th>
            <th>Legal business</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id}>
              <td>
                <strong>{application.store_name_en}</strong>
                <br />
                <span>{application.store_name_ar}</span>
                <br />
                <span className="muted-text">/store/{application.proposed_store_slug}</span>
              </td>
              <td>
                {application.owner_full_name}
                <br />
                <span className="muted-text">{application.owner_email}</span>
              </td>
              <td>{application.legal_business_name}</td>
              <td>
                <span
                  className={
                    application.status === "approved" ? "status-active" : "status-muted"
                  }
                >
                  {application.status}
                </span>
              </td>
              <td>{new Date(application.created_at).toLocaleString()}</td>
              <td>
                <Link className="secondary-link" href={`/admin/vendor-applications/${application.id}`}>
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
