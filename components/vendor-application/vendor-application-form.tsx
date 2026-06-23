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
        <legend>Owner / Responsible Person</legend>
        <div className="form-grid">
          <label className="field">
            <span>Owner full name</span>
            <input name="owner_full_name" required />
          </label>
          <label className="field">
            <span>Owner phone</span>
            <input name="owner_phone" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Owner email</span>
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
        <legend>Legal Business / Company</legend>
        <div className="form-grid">
          <label className="field">
            <span>Legal business name</span>
            <input name="legal_business_name" required />
          </label>
          <label className="field">
            <span>Commercial license number</span>
            <input name="commercial_license_number" required />
          </label>
        </div>
        <label className="field">
          <span>Business address</span>
          <textarea name="business_address" required />
        </label>
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
        <legend>Store / Merchant Operations</legend>
        <div className="form-grid">
          <label className="field">
            <span>Store English name</span>
            <input name="store_name_en" required />
          </label>
          <label className="field">
            <span>Store Arabic name</span>
            <input name="store_name_ar" dir="rtl" required />
          </label>
        </div>
        <label className="field">
          <span>Proposed store slug</span>
          <input name="proposed_store_slug" required />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Store phone</span>
            <input name="store_phone" required />
          </label>
          <label className="field">
            <span>Store WhatsApp</span>
            <input name="store_whatsapp" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Store order email</span>
            <input name="store_order_email" type="email" required />
          </label>
          <label className="field">
            <span>Store area</span>
            <input name="store_area" required />
          </label>
        </div>
        <label className="field">
          <span>Store fulfillment address</span>
          <textarea name="store_fulfillment_address" required />
        </label>
        <label className="field">
          <span>Product categories description</span>
          <textarea name="product_categories_description" required />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Short English store description</span>
            <textarea name="short_store_description_en" required />
          </label>
          <label className="field">
            <span>Short Arabic store description</span>
            <textarea name="short_store_description_ar" dir="rtl" required />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Store business hours</span>
            <input name="store_business_hours" />
          </label>
          <label className="field">
            <span>Expected daily order capacity</span>
            <input name="expected_daily_order_capacity" inputMode="numeric" />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Delivery handled by</span>
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
            <span>Return policy notes</span>
            <textarea name="return_policy_notes" />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Bank / Settlement Details</legend>
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
        <legend>Documents</legend>
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

      <button className="primary-button" type="submit">
        Submit application
      </button>
    </form>
  );
}
