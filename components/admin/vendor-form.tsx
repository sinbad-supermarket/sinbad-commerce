import { vendorStatuses, type VendorRow } from "@/features/vendors/types";

type VendorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
  vendor?: VendorRow;
};

export function VendorForm({ action, error, submitLabel, vendor }: VendorFormProps) {
  const slug = vendor?.slug ?? "";

  return (
    <form className="admin-form" action={action}>
      <div className="form-grid">
        <label className="field">
          <span>English name</span>
          <input name="name_en" defaultValue={vendor?.name_en} required />
        </label>
        <label className="field">
          <span>Arabic name</span>
          <input name="name_ar" defaultValue={vendor?.name_ar ?? ""} dir="rtl" />
        </label>
      </div>

      <label className="field">
        <span>Slug</span>
        <input name="slug" defaultValue={slug} />
      </label>

      <p className="field-help">Store URL: /store/{slug || "vendor-slug"}</p>

      <div className="form-grid">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={vendor?.status ?? "pending"}>
            {vendorStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field">
          <input
            name="is_public"
            type="checkbox"
            defaultChecked={vendor?.is_public ?? false}
          />
          <span>Public store visible when active</span>
        </label>
      </div>

      <label className="field">
        <span>English description</span>
        <textarea name="description_en" defaultValue={vendor?.description_en ?? ""} />
      </label>
      <label className="field">
        <span>Arabic description</span>
        <textarea
          name="description_ar"
          defaultValue={vendor?.description_ar ?? ""}
          dir="rtl"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
