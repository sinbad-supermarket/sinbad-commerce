"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { deliveryHandledByOptions } from "@/features/vendor-applications/types";
import {
  maxVendorApplicationDocumentSize,
  maxVendorApplicationDocumentTotalSize,
  vendorApplicationDocumentSizeMessage,
  vendorApplicationDocumentTotalSizeMessage,
} from "@/features/vendor-applications/validators";

type VendorApplicationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  success?: string;
};

export function VendorApplicationForm({
  action,
  error,
  success,
}: VendorApplicationFormProps) {
  const [clientError, setClientError] = useState<string | null>(null);

  function selectedFile(form: HTMLFormElement, name: string) {
    const input = form.elements.namedItem(name);
    return input instanceof HTMLInputElement ? input.files?.[0] ?? null : null;
  }

  function validateDocumentSizes(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const files = [
      selectedFile(form, "owner_civil_id_or_passport_document"),
      selectedFile(form, "commercial_license_document"),
      selectedFile(form, "authorization_document"),
      selectedFile(form, "bank_document"),
    ].filter(Boolean) as File[];

    if (files.some((file) => file.size > maxVendorApplicationDocumentSize)) {
      event.preventDefault();
      setClientError(vendorApplicationDocumentSizeMessage);
      return;
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);

    if (totalSize > maxVendorApplicationDocumentTotalSize) {
      event.preventDefault();
      setClientError(vendorApplicationDocumentTotalSizeMessage);
      return;
    }

    setClientError(null);
  }

  return (
    <form className="admin-form wide-form" action={action} onSubmit={validateDocumentSizes}>
      {success ? <p className="success-banner">{success}</p> : null}
      {clientError ? <p className="form-error">{clientError}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <fieldset className="fieldset">
        <legend>Company Info</legend>
        <div className="form-grid">
          <label className="field">
            <span>Company name</span>
            <input name="legal_business_name" required />
          </label>
          <label className="field">
            <span>Commercial license number</span>
            <input name="commercial_license_number" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Tax or VAT number</span>
            <input name="tax_or_vat_number" />
          </label>
          <label className="field">
            <span>Company notes</span>
            <textarea name="company_notes" />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Owner Info</legend>
        <div className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input name="owner_full_name" required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="owner_phone" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Email</span>
            <input name="owner_email" type="email" required />
          </label>
          <label className="field">
            <span>Civil ID or passport number</span>
            <input name="owner_civil_id_or_passport_number" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Authorized signatory name</span>
            <input name="authorized_signatory_name" />
          </label>
          <label className="field">
            <span>Authorized signatory phone</span>
            <input name="authorized_signatory_phone" />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Emergency contact phone</span>
            <input name="emergency_contact_phone" />
          </label>
          <label className="field">
            <span>Owner notes</span>
            <textarea name="owner_notes" />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Store Info</legend>
        <div className="form-grid">
          <label className="field">
            <span>Store name (English)</span>
            <input name="store_name_en" required />
          </label>
          <label className="field">
            <span>Store name (Arabic)</span>
            <input name="store_name_ar" dir="rtl" required />
          </label>
        </div>
        <label className="field">
          <span>Store URL slug</span>
          <input name="proposed_store_slug" required />
        </label>
        <label className="field">
          <span>Product categories</span>
          <textarea name="product_categories_description" required />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Short store description (English)</span>
            <textarea name="short_store_description_en" required />
          </label>
          <label className="field">
            <span>Short store description (Arabic)</span>
            <textarea name="short_store_description_ar" dir="rtl" required />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Operations / Address</legend>
        <div className="form-grid">
          <label className="field">
            <span>Store phone</span>
            <input name="store_phone" required />
          </label>
          <label className="field">
            <span>WhatsApp</span>
            <input name="store_whatsapp" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Order email</span>
            <input name="store_order_email" type="email" required />
          </label>
          <label className="field">
            <span>City / Area</span>
            <input name="store_area" required />
          </label>
        </div>
        <label className="field">
          <span>Business address</span>
          <textarea name="business_address" required />
        </label>
        <label className="field">
          <span>Pickup / fulfillment address</span>
          <textarea name="store_fulfillment_address" required />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Business hours</span>
            <input name="store_business_hours" />
          </label>
          <label className="field">
            <span>Daily order capacity</span>
            <input name="expected_daily_order_capacity" inputMode="numeric" />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Delivery preference</span>
            <select name="delivery_handled_by" defaultValue="">
              <option value="">Not sure yet</option>
              {deliveryHandledByOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Return policy</span>
            <textarea name="return_policy_notes" />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Payout / Bank Info</legend>
        <div className="form-grid">
          <label className="field">
            <span>Bank name</span>
            <input name="bank_name" required />
          </label>
          <label className="field">
            <span>Account holder name</span>
            <input name="account_holder_name" required />
          </label>
        </div>
        <label className="field">
          <span>IBAN</span>
          <input name="iban" required />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Account number</span>
            <input name="account_number" />
          </label>
          <label className="field">
            <span>Bank branch</span>
            <input name="bank_branch" />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Document Uploads</legend>
        <p className="field-help">
          PDF, JPG, PNG, or WebP. Max 3 MB per file. Max 10 MB total.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>Owner civil ID/passport document</span>
            <input
              name="owner_civil_id_or_passport_document"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label className="field">
            <span>Commercial license document</span>
            <input
              name="commercial_license_document"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              required
            />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Authorization document</span>
            <input
              name="authorization_document"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
            />
          </label>
          <label className="field">
            <span>Bank document</span>
            <input
              name="bank_document"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Agreement</legend>
        <label className="checkbox-field">
          <input name="accept_commission" type="checkbox" required />
          <span>I accept the 5% Sinbad commission for V1 vendor sales.</span>
        </label>
        <label className="checkbox-field">
          <input name="accept_sinbad_delivery" type="checkbox" required />
          <span>I accept Sinbad-managed delivery in V1.</span>
        </label>
      </fieldset>

      <button className="primary-button" type="submit">
        Submit Application
      </button>
    </form>
  );
}
