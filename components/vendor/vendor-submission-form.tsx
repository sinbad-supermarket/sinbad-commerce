"use client";

import { useMemo, useState } from "react";
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

function fieldValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function assignedCategoryIds(snapshot?: ProductSubmissionSnapshot) {
  return snapshot?.categories.map((category) => category.category_id) ?? [];
}

function selectedCategoryPair(categories: CategoryRow[], snapshot?: ProductSubmissionSnapshot) {
  const selectedIds = assignedCategoryIds(snapshot);
  const selectedCategories = selectedIds
    .map((categoryId) => categories.find((category) => category.id === categoryId))
    .filter((category): category is CategoryRow => Boolean(category));
  const selectedSubcategory = selectedCategories.find((category) => category.parent_id);
  const selectedParent =
    selectedCategories.find((category) => !category.parent_id) ??
    categories.find((category) => category.id === selectedSubcategory?.parent_id) ??
    null;

  return {
    categoryId: selectedParent?.id ?? "",
    subcategoryId: selectedSubcategory?.id ?? "",
  };
}

export function VendorSubmissionForm({
  action,
  categories,
  error,
  readOnly = false,
  snapshot,
  submitLabel,
}: VendorSubmissionFormProps) {
  const initialSelection = useMemo(
    () => selectedCategoryPair(categories, snapshot),
    [categories, snapshot],
  );
  const [categoryId, setCategoryId] = useState(initialSelection.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(initialSelection.subcategoryId);
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [specRows, setSpecRows] = useState(() => {
    const specs = snapshot?.product.specifications ?? [];
    return specs.length > 0 ? specs : [{ key: "", value: "" }];
  });
  const parentCategories = categories.filter((category) => !category.parent_id);
  const subcategories = categories.filter((category) => category.parent_id === categoryId);
  const filteredParents = parentCategories.filter((category) =>
    `${category.name_en} ${category.name_ar}`.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredSubcategories = subcategories.filter((category) =>
    `${category.name_en} ${category.name_ar}`.toLowerCase().includes(
      subcategorySearch.toLowerCase(),
    ),
  );

  return (
    <form className="admin-form wide-form" action={action}>
      <fieldset className="fieldset">
        <legend>Short Description</legend>
        <div className="form-grid">
          <label className="field">
            <span>English short description</span>
            <textarea
              name="short_description_en"
              defaultValue={snapshot?.product.short_description_en ?? ""}
              disabled={readOnly}
              maxLength={180}
            />
          </label>
          <label className="field">
            <span>Arabic short description</span>
            <textarea
              name="short_description_ar"
              defaultValue={snapshot?.product.short_description_ar ?? ""}
              disabled={readOnly}
              dir="rtl"
              maxLength={180}
            />
          </label>
        </div>
        <p className="field-help">Required before review. Use 20 to 180 characters.</p>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Product Name</legend>
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
            placeholder="Generated from English name if blank"
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Category</legend>
        <label className="field">
          <span>Search categories</span>
          <input
            disabled={readOnly}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Type to filter parent categories"
            type="search"
            value={categorySearch}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select
            disabled={readOnly}
            name="category_id"
            onChange={(event) => {
              setCategoryId(event.target.value);
              setSubcategoryId("");
              setSubcategorySearch("");
            }}
            required={false}
            value={categoryId}
          >
            <option value="">Select a category</option>
            {filteredParents.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en} / {category.name_ar}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Subcategory</legend>
        <label className="field">
          <span>Search subcategories</span>
          <input
            disabled={readOnly || !categoryId}
            onChange={(event) => setSubcategorySearch(event.target.value)}
            placeholder="Choose a category first"
            type="search"
            value={subcategorySearch}
          />
        </label>
        <label className="field">
          <span>Subcategory</span>
          <select
            disabled={readOnly || !categoryId}
            name="subcategory_id"
            onChange={(event) => setSubcategoryId(event.target.value)}
            value={subcategoryId}
          >
            <option value="">Select a subcategory</option>
            {filteredSubcategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en} / {category.name_ar}
              </option>
            ))}
          </select>
        </label>
        <input
          name="primary_category_id"
          type="hidden"
          value={subcategoryId || categoryId}
        />
        <label className="field">
          <span>Suggested category</span>
          <input
            name="suggested_category"
            defaultValue={snapshot?.product.suggested_category ?? ""}
            disabled={readOnly}
            placeholder="Optional if the best category is missing"
          />
        </label>
      </fieldset>

      <div className="form-grid">
        <label className="field">
          <span>Brand</span>
          <input
            name="brand_name"
            defaultValue={snapshot?.product.brand_name ?? ""}
            disabled={readOnly}
            placeholder="Brand"
          />
        </label>
        <label className="field">
          <span>Product Video URL</span>
          <input
            name="video_url"
            defaultValue={snapshot?.product.video_url ?? ""}
            disabled={readOnly}
            placeholder="https://..."
            type="url"
          />
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Regular Price (KWD)</span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.001"
            defaultValue={fieldValue(snapshot?.product.price)}
            disabled={readOnly}
          />
        </label>
        <label className="field">
          <span>Sale Price (KWD)</span>
          <input
            name="sale_price"
            type="number"
            min="0"
            step="0.001"
            defaultValue={fieldValue(snapshot?.product.sale_price)}
            disabled={readOnly}
          />
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Stock Quantity</span>
          <input
            name="stock_quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={fieldValue(snapshot?.product.stock_quantity)}
            disabled={readOnly}
          />
        </label>
        <label className="field">
          <span>Availability</span>
          <select
            name="availability"
            defaultValue={snapshot?.product.availability ?? "in_stock"}
            disabled={readOnly}
          >
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="preorder">Preorder</option>
          </select>
        </label>
      </div>

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

      <fieldset className="fieldset">
        <legend>Product Specifications</legend>
        <div className="spec-list">
          {specRows.map((spec, index) => (
            <div className="spec-row" key={`${index}-${spec.key}`}>
              <label className="field">
                <span>Key</span>
                <input
                  name="spec_key"
                  defaultValue={spec.key}
                  disabled={readOnly}
                  maxLength={80}
                  placeholder="Weight"
                />
              </label>
              <label className="field">
                <span>Value</span>
                <input
                  name="spec_value"
                  defaultValue={spec.value}
                  disabled={readOnly}
                  maxLength={180}
                  placeholder="500g"
                />
              </label>
            </div>
          ))}
        </div>
        {!readOnly ? (
          <button
            className="secondary-button"
            disabled={specRows.length >= 20}
            onClick={() => setSpecRows((rows) => [...rows, { key: "", value: "" }])}
            type="button"
          >
            Add specification
          </button>
        ) : null}
      </fieldset>

      <label className="field">
        <span>Warranty</span>
        <input
          name="warranty"
          defaultValue={snapshot?.product.warranty ?? ""}
          disabled={readOnly}
          placeholder="1 year warranty, No warranty, etc."
        />
      </label>

      <fieldset className="fieldset">
        <legend>Full Description</legend>
        <div className="form-grid">
          <label className="field">
            <span>English full description</span>
            <textarea
              name="description_en"
              defaultValue={snapshot?.product.description_en ?? ""}
              disabled={readOnly}
            />
          </label>
          <label className="field">
            <span>Arabic full description</span>
            <textarea
              name="description_ar"
              defaultValue={snapshot?.product.description_ar ?? ""}
              disabled={readOnly}
              dir="rtl"
            />
          </label>
        </div>
      </fieldset>

      <label className="field">
        <span>Intended public status after approval</span>
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

      {error ? <p className="form-error">{error}</p> : null}

      {!readOnly ? (
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
      ) : null}
    </form>
  );
}
