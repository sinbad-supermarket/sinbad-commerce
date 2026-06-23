import type { CategoryRow } from "@/features/categories/types";
import type { ProductSubmissionSnapshot } from "@/features/vendor-submissions/types";

type VendorSubmissionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryRow[];
  error?: string;
  readOnly?: boolean;
  snapshot?: ProductSubmissionSnapshot;
  submitLabel: string;
};

function priceValue(snapshot?: ProductSubmissionSnapshot) {
  return snapshot?.product.price ?? "";
}

function assignedCategoryIds(snapshot?: ProductSubmissionSnapshot) {
  return snapshot?.categories.map((category) => category.category_id) ?? [];
}

function primaryCategoryId(snapshot?: ProductSubmissionSnapshot) {
  return (
    snapshot?.categories.find((category) => category.is_primary)?.category_id ?? ""
  );
}

export function VendorSubmissionForm({
  action,
  categories,
  error,
  readOnly = false,
  snapshot,
  submitLabel,
}: VendorSubmissionFormProps) {
  const selectedCategoryIds = assignedCategoryIds(snapshot);

  return (
    <form className="admin-form" action={action}>
      <div className="form-grid">
        <label className="field">
          <span>English name</span>
          <input
            name="name_en"
            defaultValue={snapshot?.product.name_en}
            disabled={readOnly}
            required
          />
        </label>
        <label className="field">
          <span>Arabic name</span>
          <input
            name="name_ar"
            defaultValue={snapshot?.product.name_ar}
            disabled={readOnly}
            required
            dir="rtl"
          />
        </label>
      </div>

      <label className="field">
        <span>Slug</span>
        <input
          name="slug"
          defaultValue={snapshot?.product.slug}
          disabled={readOnly}
        />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>SKU</span>
          <input
            name="sku"
            defaultValue={snapshot?.product.sku ?? ""}
            disabled={readOnly}
          />
        </label>
        <label className="field">
          <span>Barcode</span>
          <input
            name="barcode"
            defaultValue={snapshot?.product.barcode ?? ""}
            disabled={readOnly}
          />
        </label>
      </div>

      <label className="field">
        <span>Price</span>
        <input
          name="price"
          type="number"
          min="0"
          step="0.001"
          defaultValue={priceValue(snapshot)}
          disabled={readOnly}
        />
      </label>

      <label className="field">
        <span>Intended status</span>
        <select
          name="intended_status"
          defaultValue={snapshot?.product.intended_status ?? "draft"}
          disabled={readOnly}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <label className="field">
        <span>English short description</span>
        <textarea
          name="short_description_en"
          defaultValue={snapshot?.product.short_description_en ?? ""}
          disabled={readOnly}
        />
      </label>
      <label className="field">
        <span>Arabic short description</span>
        <textarea
          name="short_description_ar"
          defaultValue={snapshot?.product.short_description_ar ?? ""}
          disabled={readOnly}
          dir="rtl"
        />
      </label>
      <label className="field">
        <span>English description</span>
        <textarea
          name="description_en"
          defaultValue={snapshot?.product.description_en ?? ""}
          disabled={readOnly}
        />
      </label>
      <label className="field">
        <span>Arabic description</span>
        <textarea
          name="description_ar"
          defaultValue={snapshot?.product.description_ar ?? ""}
          disabled={readOnly}
          dir="rtl"
        />
      </label>

      <fieldset className="fieldset" disabled={readOnly}>
        <legend>Categories</legend>
        {categories.length === 0 ? (
          <p className="field-help">Active categories are required before submission.</p>
        ) : (
          <div className="check-list">
            {categories.map((category) => (
              <label key={category.id} className="checkbox-field">
                <input
                  name="category_ids"
                  type="checkbox"
                  value={category.id}
                  defaultChecked={selectedCategoryIds.includes(category.id)}
                />
                <span>{category.name_en}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="field">
        <span>Primary category</span>
        <select
          name="primary_category_id"
          defaultValue={primaryCategoryId(snapshot)}
          disabled={readOnly}
        >
          <option value="">Auto-select first assigned category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_en}
            </option>
          ))}
        </select>
      </label>

      <p className="field-help">Images are deferred for a later vendor milestone.</p>

      {error ? <p className="form-error">{error}</p> : null}

      {!readOnly ? (
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
      ) : null}
    </form>
  );
}
