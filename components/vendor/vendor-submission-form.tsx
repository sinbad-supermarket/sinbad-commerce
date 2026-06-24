"use client";

import { useMemo, useState } from "react";
import { ProductDescriptionEditor } from "@/components/vendor/product-description-editor";
import type { CategoryRow } from "@/features/categories/types";
import type { ProductSubmissionSnapshot } from "@/features/vendor-submissions/types";

type VendorSubmissionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryRow[];
  error?: string;
  readOnly?: boolean;
  snapshot?: ProductSubmissionSnapshot;
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

function categoryLabel(category: CategoryRow) {
  return `${category.name_en} / ${category.name_ar}`;
}

const brandSuggestions = [
  "Apple",
  "Samsung",
  "Sony",
  "LG",
  "Nike",
  "Adidas",
  "Nestle",
  "Coca-Cola",
  "Pepsi",
  "Nivea",
  "Pampers",
  "Generic",
];

export function VendorSubmissionForm({
  action,
  categories,
  error,
  readOnly = false,
  snapshot,
}: VendorSubmissionFormProps) {
  const initialSelection = useMemo(
    () => selectedCategoryPair(categories, snapshot),
    [categories, snapshot],
  );
  const initialCategory = categories.find((category) => category.id === initialSelection.categoryId);
  const initialSubcategory = categories.find(
    (category) => category.id === initialSelection.subcategoryId,
  );
  const [categoryInput, setCategoryInput] = useState(
    initialCategory ? categoryLabel(initialCategory) : "",
  );
  const [subcategoryInput, setSubcategoryInput] = useState(
    initialSubcategory ? categoryLabel(initialSubcategory) : "",
  );
  const [specRows, setSpecRows] = useState(() => snapshot?.product.specifications ?? []);
  const [showSuggestedCategory, setShowSuggestedCategory] = useState(
    Boolean(snapshot?.product.suggested_category),
  );
  const [showBrandRequest, setShowBrandRequest] = useState(
    Boolean(snapshot?.product.brand_request),
  );
  const parentCategories = categories.filter((category) => !category.parent_id);
  const selectedCategory = parentCategories.find(
    (category) => categoryLabel(category) === categoryInput,
  );
  const subcategories = categories.filter(
    (category) => category.parent_id === selectedCategory?.id,
  );
  const selectedSubcategory = subcategories.find(
    (category) => categoryLabel(category) === subcategoryInput,
  );

  return (
    <form className="seller-product-form" action={action} id="vendor-product-form">
      <fieldset className="fieldset">
        <legend>Basic Product Information</legend>
        <div className="form-grid">
          <label className="field">
            <span>Product Name (English)</span>
            <input
              name="name_en"
              defaultValue={snapshot?.product.name_en}
              disabled={readOnly}
              required
            />
          </label>
          <label className="field">
            <span>Product Name (Arabic)</span>
            <input
              name="name_ar"
              defaultValue={snapshot?.product.name_ar}
              disabled={readOnly}
              required
              dir="rtl"
            />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Short Description (English)</span>
            <textarea
              name="short_description_en"
              defaultValue={snapshot?.product.short_description_en ?? ""}
              disabled={readOnly}
              maxLength={180}
            />
          </label>
          <label className="field">
            <span>Short Description (Arabic)</span>
            <textarea
              name="short_description_ar"
              defaultValue={snapshot?.product.short_description_ar ?? ""}
              disabled={readOnly}
              dir="rtl"
              maxLength={180}
            />
          </label>
        </div>
        <p className="field-help">Use 20 to 180 characters for each short description.</p>
        <div className="form-grid">
          <label className="field">
            <span>Category</span>
            <input
              disabled={readOnly}
              list="vendor-category-options"
              onChange={(event) => {
                setCategoryInput(event.target.value);
                setSubcategoryInput("");
              }}
              placeholder="Search and select a category"
              value={categoryInput}
            />
          </label>
          <label className="field">
            <span>Subcategory</span>
            <input
              disabled={readOnly || !selectedCategory}
              list="vendor-subcategory-options"
              onChange={(event) => setSubcategoryInput(event.target.value)}
              placeholder={selectedCategory ? "Search and select a subcategory" : "Choose category first"}
              value={subcategoryInput}
            />
          </label>
        </div>
        <datalist id="vendor-category-options">
          {parentCategories.map((category) => (
            <option key={category.id} value={categoryLabel(category)} />
          ))}
        </datalist>
        <datalist id="vendor-subcategory-options">
          {subcategories.map((category) => (
            <option key={category.id} value={categoryLabel(category)} />
          ))}
        </datalist>
        <input name="category_id" type="hidden" value={selectedCategory?.id ?? ""} />
        <input name="subcategory_id" type="hidden" value={selectedSubcategory?.id ?? ""} />
        <input
          name="primary_category_id"
          type="hidden"
          value={selectedSubcategory?.id ?? selectedCategory?.id ?? ""}
        />
        {showSuggestedCategory ? (
          <label className="field">
            <span>Suggested Category</span>
            <input
              name="suggested_category"
              defaultValue={snapshot?.product.suggested_category ?? ""}
              disabled={readOnly}
              placeholder="Tell us the category you expected"
            />
          </label>
        ) : (
          <button
            className="link-button"
            disabled={readOnly}
            onClick={() => setShowSuggestedCategory(true)}
            type="button"
          >
            Can&apos;t find the right category?
          </button>
        )}
        <div className="form-grid">
          <label className="field">
            <span>Brand</span>
            <input
              name="brand_name"
              defaultValue={snapshot?.product.brand_name ?? ""}
              disabled={readOnly}
              list="vendor-brand-options"
              placeholder="Search or enter brand"
            />
          </label>
          <label className="field">
            <span>Product Condition</span>
            <select
              name="product_condition"
              defaultValue={snapshot?.product.product_condition ?? "new"}
              disabled={readOnly}
            >
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
              <option value="used">Used</option>
            </select>
          </label>
        </div>
        <datalist id="vendor-brand-options">
          {brandSuggestions.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
        {showBrandRequest ? (
          <label className="field">
            <span>Request New Brand</span>
            <input
              name="brand_request"
              defaultValue={snapshot?.product.brand_request ?? ""}
              disabled={readOnly}
              placeholder="Enter the brand name to request"
            />
          </label>
        ) : (
          <button
            className="link-button"
            disabled={readOnly}
            onClick={() => setShowBrandRequest(true)}
            type="button"
          >
            Can&apos;t find your brand? Request a new brand
          </button>
        )}
        <label className="field">
          <span>YouTube, TikTok, or Instagram URL (Optional)</span>
          <input
            name="video_url"
            defaultValue={snapshot?.product.video_url ?? ""}
            disabled={readOnly}
            placeholder="https://..."
            type="url"
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Pricing & Inventory</legend>
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
            <span>Available Stock</span>
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
            <span>SKU (Optional)</span>
            <input
              name="sku"
              defaultValue={snapshot?.product.sku ?? ""}
              disabled={readOnly}
            />
          </label>
          <label className="field">
            <span>Barcode (Optional)</span>
            <input
              name="barcode"
              defaultValue={snapshot?.product.barcode ?? ""}
              disabled={readOnly}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Product Specifications</legend>
        {specRows.length === 0 ? (
          <p className="empty-state">
            Add specifications only when needed. Examples: Weight, Country of Origin,
            Material, Color, Size.
          </p>
        ) : (
          <div className="spec-list">
            {specRows.map((spec, index) => (
              <div className="spec-row" key={`${index}-${spec.key}`}>
                <label className="field">
                  <span>Specification</span>
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
                {!readOnly ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setSpecRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
                    }
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {!readOnly ? (
          <button
            className="secondary-button"
            disabled={specRows.length >= 20}
            onClick={() => setSpecRows((rows) => [...rows, { key: "", value: "" }])}
            type="button"
          >
            + Add Specification
          </button>
        ) : null}
        <label className="field">
          <span>Warranty Information (Optional)</span>
          <input
            name="warranty"
            defaultValue={snapshot?.product.warranty ?? ""}
            disabled={readOnly}
            placeholder="1 year warranty, No warranty, etc."
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Full Description</legend>
        <ProductDescriptionEditor
          initialValue={snapshot?.product.description_en}
          label="Product Description (English)"
          name="description_en"
          readOnly={readOnly}
        />
        <ProductDescriptionEditor
          dir="rtl"
          initialValue={snapshot?.product.description_ar}
          label="Product Description (Arabic)"
          name="description_ar"
          readOnly={readOnly}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Actions</legend>
        <label className="field">
          <span>Product status after approval</span>
          <select
            name="intended_status"
            defaultValue={snapshot?.product.intended_status ?? "active"}
            disabled={readOnly}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {error ? <p className="form-error">{error}</p> : null}
      </fieldset>
    </form>
  );
}
