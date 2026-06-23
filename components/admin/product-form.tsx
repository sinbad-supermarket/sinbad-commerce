import type { CategoryRow } from "@/features/categories/types";
import { productStatuses, type ProductRow } from "@/features/products/types";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  assignedCategoryIds?: string[];
  categories: CategoryRow[];
  error?: string;
  primaryCategoryId?: string | null;
  product?: ProductRow;
  submitLabel: string;
};

function priceValue(product?: ProductRow) {
  if (product?.price === null || product?.price === undefined) {
    return "";
  }

  return String(product.price);
}

export function ProductForm({
  action,
  assignedCategoryIds = [],
  categories,
  error,
  primaryCategoryId,
  product,
  submitLabel,
}: ProductFormProps) {
  return (
    <form className="admin-form" action={action}>
      <div className="form-grid">
        <label className="field">
          <span>English name</span>
          <input name="name_en" defaultValue={product?.name_en} required />
        </label>
        <label className="field">
          <span>Arabic name</span>
          <input name="name_ar" defaultValue={product?.name_ar} required dir="rtl" />
        </label>
      </div>

      <label className="field">
        <span>Slug</span>
        <input name="slug" defaultValue={product?.slug} />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>SKU</span>
          <input name="sku" defaultValue={product?.sku ?? ""} />
        </label>
        <label className="field">
          <span>Barcode</span>
          <input name="barcode" defaultValue={product?.barcode ?? ""} />
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Price</span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.001"
            defaultValue={priceValue(product)}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={product?.status ?? "draft"}>
            {productStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>English short description</span>
        <textarea
          name="short_description_en"
          defaultValue={product?.short_description_en ?? ""}
        />
      </label>
      <label className="field">
        <span>Arabic short description</span>
        <textarea
          name="short_description_ar"
          defaultValue={product?.short_description_ar ?? ""}
          dir="rtl"
        />
      </label>
      <label className="field">
        <span>English description</span>
        <textarea name="description_en" defaultValue={product?.description_en ?? ""} />
      </label>
      <label className="field">
        <span>Arabic description</span>
        <textarea
          name="description_ar"
          defaultValue={product?.description_ar ?? ""}
          dir="rtl"
        />
      </label>

      <fieldset className="fieldset">
        <legend>Categories</legend>
        {categories.length === 0 ? (
          <p className="field-help">Create categories before activating products.</p>
        ) : (
          <div className="check-list">
            {categories.map((category) => (
              <label key={category.id} className="checkbox-field">
                <input
                  name="category_ids"
                  type="checkbox"
                  value={category.id}
                  defaultChecked={assignedCategoryIds.includes(category.id)}
                />
                <span>{category.name_en}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="field">
        <span>Primary category</span>
        <select name="primary_category_id" defaultValue={primaryCategoryId ?? ""}>
          <option value="">Auto-select first assigned category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_en}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
