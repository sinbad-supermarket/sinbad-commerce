import type { CategoryRow } from "@/features/categories/types";

type CategoryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  category?: CategoryRow;
  error?: string;
  parentOptions: CategoryRow[];
  submitLabel: string;
};

function optionLabel(category: CategoryRow, categories: CategoryRow[]) {
  const parent = category.parent_id
    ? categories.find((item) => item.id === category.parent_id)
    : null;

  return parent ? `${parent.name_en} / ${category.name_en}` : category.name_en;
}

export function CategoryForm({
  action,
  category,
  error,
  parentOptions,
  submitLabel,
}: CategoryFormProps) {
  return (
    <form className="admin-form" action={action}>
      <div className="form-grid">
        <label className="field">
          <span>English name</span>
          <input name="name_en" defaultValue={category?.name_en} required />
        </label>
        <label className="field">
          <span>Arabic name</span>
          <input name="name_ar" defaultValue={category?.name_ar} required dir="rtl" />
        </label>
      </div>

      <label className="field">
        <span>Slug</span>
        <input name="slug" defaultValue={category?.slug} />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Parent category</span>
          <select name="parent_id" defaultValue={category?.parent_id ?? ""}>
            <option value="">None</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {optionLabel(parent, parentOptions)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
          />
        </label>
      </div>

      <label className="field">
        <span>English description</span>
        <textarea name="description_en" defaultValue={category?.description_en ?? ""} />
      </label>
      <label className="field">
        <span>Arabic description</span>
        <textarea
          name="description_ar"
          defaultValue={category?.description_ar ?? ""}
          dir="rtl"
        />
      </label>

      <label className="checkbox-field">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={category?.is_active ?? true}
        />
        <span>Active</span>
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
