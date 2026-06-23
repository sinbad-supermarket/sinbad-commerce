import Link from "next/link";
import type {
  VendorApplicationDocument,
  VendorApplicationRow,
} from "@/features/vendor-applications/types";

type VendorApplicationDetailProps = {
  application: VendorApplicationRow;
  documents: VendorApplicationDocument[];
  error?: string;
  success?: string;
  onMarkUnderReview: () => void | Promise<void>;
  onApprove: (formData: FormData) => void | Promise<void>;
  onReject: (formData: FormData) => void | Promise<void>;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? "Not provided"}</dd>
    </div>
  );
}

export function VendorApplicationDetail({
  application,
  documents,
  error,
  success,
  onMarkUnderReview,
  onApprove,
  onReject,
}: VendorApplicationDetailProps) {
  const canReview = ["submitted", "under_review"].includes(application.status);

  return (
    <div className="section-stack">
      {success ? <p className="success-banner">{success}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Application status</h2>
            <p className="page-copy">
              {application.status} submitted on{" "}
              {new Date(application.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={application.status === "approved" ? "status-active" : "status-muted"}
          >
            {application.status}
          </span>
        </div>
        {application.status === "approved" ? (
          <p className="success-banner">
            Manual next steps: create or invite the vendor Auth user for{" "}
            {application.vendor_login_email ?? application.owner_email}, then assign the
            user on the vendor edit page. The vendor store remains private until an admin
            toggles public visibility.
          </p>
        ) : null}
        {application.status === "rejected" ? (
          <p className="warning-banner">
            Send the rejection reason manually to {application.owner_email}. No vendor or
            Auth user was created automatically.
          </p>
        ) : null}
      </section>

      <section className="admin-panel">
        <h2>Owner / Responsible Person</h2>
        <dl className="detail-grid">
          <DetailItem label="Owner full name" value={application.owner_full_name} />
          <DetailItem label="Owner phone" value={application.owner_phone} />
          <DetailItem label="Owner email" value={application.owner_email} />
          <DetailItem
            label="Civil ID or passport number"
            value={application.owner_civil_id_or_passport_number}
          />
          <DetailItem
            label="Authorized signatory"
            value={application.authorized_signatory_name}
          />
          <DetailItem
            label="Authorized signatory phone"
            value={application.authorized_signatory_phone}
          />
          <DetailItem
            label="Emergency contact phone"
            value={application.emergency_contact_phone}
          />
          <DetailItem label="Owner notes" value={application.owner_notes} />
        </dl>
      </section>

      <section className="admin-panel">
        <h2>Legal Business / Company</h2>
        <dl className="detail-grid">
          <DetailItem label="Legal business name" value={application.legal_business_name} />
          <DetailItem
            label="Commercial license number"
            value={application.commercial_license_number}
          />
          <DetailItem label="Business address" value={application.business_address} />
          <DetailItem label="Tax or VAT number" value={application.tax_or_vat_number} />
          <DetailItem label="Company notes" value={application.company_notes} />
        </dl>
      </section>

      <section className="admin-panel">
        <h2>Store / Merchant Operations</h2>
        <dl className="detail-grid">
          <DetailItem label="Store English name" value={application.store_name_en} />
          <DetailItem label="Store Arabic name" value={application.store_name_ar} />
          <DetailItem label="Proposed slug" value={application.proposed_store_slug} />
          <DetailItem label="Store URL" value={`/store/${application.proposed_store_slug}`} />
          <DetailItem label="Store phone" value={application.store_phone} />
          <DetailItem label="Store WhatsApp" value={application.store_whatsapp} />
          <DetailItem label="Store order email" value={application.store_order_email} />
          <DetailItem label="Store area" value={application.store_area} />
          <DetailItem
            label="Fulfillment address"
            value={application.store_fulfillment_address}
          />
          <DetailItem
            label="Product categories"
            value={application.product_categories_description}
          />
          <DetailItem
            label="English description"
            value={application.short_store_description_en}
          />
          <DetailItem
            label="Arabic description"
            value={application.short_store_description_ar}
          />
          <DetailItem label="Business hours" value={application.store_business_hours} />
          <DetailItem
            label="Expected daily order capacity"
            value={application.expected_daily_order_capacity}
          />
          <DetailItem
            label="Delivery handled by"
            value={application.delivery_handled_by}
          />
          <DetailItem label="Return policy notes" value={application.return_policy_notes} />
        </dl>
      </section>

      <section className="admin-panel">
        <h2>Documents</h2>
        <div className="document-list">
          {documents.map((document) => (
            <Link
              className="secondary-link"
              href={document.signedUrl}
              key={document.path}
              target="_blank"
              rel="noreferrer"
            >
              {document.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Review actions</h2>
        {canReview ? (
          <div className="review-actions">
            <form action={onMarkUnderReview}>
              <button className="secondary-button" type="submit">
                Mark under review
              </button>
            </form>

            <form className="admin-form compact-form" action={onApprove}>
              <label className="field">
                <span>Vendor login email</span>
                <input
                  name="vendor_login_email"
                  type="email"
                  defaultValue={application.owner_email}
                />
              </label>
              <label className="field">
                <span>Admin notes</span>
                <textarea name="admin_notes" />
              </label>
              <button className="primary-button" type="submit">
                Approve and create private vendor
              </button>
            </form>

            <form className="admin-form compact-form" action={onReject}>
              <label className="field">
                <span>Rejection reason</span>
                <textarea name="rejection_reason" required />
              </label>
              <label className="field">
                <span>Admin notes</span>
                <textarea name="admin_notes" />
              </label>
              <button className="danger-button" type="submit">
                Reject application
              </button>
            </form>
          </div>
        ) : (
          <dl className="detail-grid">
            <DetailItem label="Reviewed at" value={application.reviewed_at} />
            <DetailItem label="Vendor login email" value={application.vendor_login_email} />
            <DetailItem label="Approved vendor id" value={application.approved_vendor_id} />
            <DetailItem label="Rejection reason" value={application.rejection_reason} />
            <DetailItem label="Admin notes" value={application.admin_notes} />
          </dl>
        )}
      </section>
    </div>
  );
}
