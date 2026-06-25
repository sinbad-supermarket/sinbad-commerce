"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { ProductDescriptionEditor } from "@/components/vendor/product-description-editor";
import type { CategoryRow } from "@/features/categories/types";
import type { ProductSubmissionSnapshot } from "@/features/vendor-submissions/types";
import type {
  VendorSubmissionFormActionState,
  VendorSubmissionFormValues,
} from "@/features/vendor-submissions/actions";

type VendorSubmissionFormProps = {
  action: (
    previousState: VendorSubmissionFormActionState,
    formData: FormData,
  ) => Promise<VendorSubmissionFormActionState>;
  categories: CategoryRow[];
  children?: ReactNode;
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

function selectedCategoryPairFromValues(values: VendorSubmissionFormValues | null) {
  return {
    categoryId: values?.category_id ?? "",
    subcategoryId: values?.subcategory_id ?? "",
  };
}

function productValue(
  values: VendorSubmissionFormValues | null,
  snapshot: ProductSubmissionSnapshot | undefined,
  key: keyof VendorSubmissionFormValues,
  fallback = "",
) {
  if (values && typeof values[key] === "string") {
    return values[key];
  }

  const product = snapshot?.product;

  switch (key) {
    case "name_en":
      return product?.name_en ?? fallback;
    case "name_ar":
      return product?.name_ar ?? fallback;
    case "short_description_en":
      return product?.short_description_en ?? fallback;
    case "short_description_ar":
      return product?.short_description_ar ?? fallback;
    case "suggested_category":
      return product?.suggested_category ?? fallback;
    case "brand_name":
      return product?.brand_name ?? fallback;
    case "brand_request":
      return product?.brand_request ?? fallback;
    case "product_condition":
      return product?.product_condition ?? fallback;
    case "video_url":
      return product?.video_url ?? fallback;
    case "price":
      return fieldValue(product?.price) || fallback;
    case "sale_price":
      return fieldValue(product?.sale_price) || fallback;
    case "stock_quantity":
      return fieldValue(product?.stock_quantity) || fallback;
    case "availability":
      return product?.availability ?? fallback;
    case "sku":
      return product?.sku ?? fallback;
    case "barcode":
      return product?.barcode ?? fallback;
    case "warranty":
      return product?.warranty ?? fallback;
    case "description_en":
      return product?.description_en ?? fallback;
    case "description_ar":
      return product?.description_ar ?? fallback;
    case "intended_status":
      return product?.intended_status ?? fallback;
    default:
      return fallback;
  }
}

function categoryLabel(category: CategoryRow) {
  return category.name_en;
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
  children,
  error,
  readOnly = false,
  snapshot,
}: VendorSubmissionFormProps) {
  const [formState, formAction] = useActionState(action, {
    error: error ?? null,
    success: null,
    values: null,
  });
  const submittedValues = formState.values;
  const initialSelection = useMemo(
    () =>
      submittedValues
        ? selectedCategoryPairFromValues(submittedValues)
        : selectedCategoryPair(categories, snapshot),
    [categories, snapshot, submittedValues],
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
  const [specRows, setSpecRows] = useState(() =>
    submittedValues?.specifications ?? snapshot?.product.specifications ?? [],
  );
  const [showSuggestedCategory, setShowSuggestedCategory] = useState(
    submittedValues?.suggested_category_visible ?? Boolean(snapshot?.product.suggested_category),
  );
  const [showBrandRequest, setShowBrandRequest] = useState(
    submittedValues?.brand_request_visible ?? Boolean(snapshot?.product.brand_request),
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
  const formError = formState.error ?? error;

  return (
    <form
      action={formAction}
      className="seller-product-form"
      encType="multipart/form-data"
      id="vendor-product-form"
    >
      {children}

      <fieldset className="fieldset">
        <legend>Basic Product Information</legend>
        <div className="form-grid">
          <label className="field">
            <span>Product Name (English)</span>
            <input
              name="name_en"
              defaultValue={productValue(submittedValues, snapshot, "name_en")}
              disabled={readOnly}
              required
            />
          </label>
          <label className="field">
            <span>Product Name (Arabic)</span>
            <input
              name="name_ar"
              defaultValue={productValue(submittedValues, snapshot, "name_ar")}
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
              defaultValue={productValue(submittedValues, snapshot, "short_description_en")}
              disabled={readOnly}
              maxLength={180}
            />
          </label>
          <label className="field">
            <span>Short Description (Arabic)</span>
            <textarea
              name="short_description_ar"
              defaultValue={productValue(submittedValues, snapshot, "short_description_ar")}
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
            <input name="suggested_category_visible" type="hidden" value="true" />
            <input
              name="suggested_category"
              defaultValue={productValue(submittedValues, snapshot, "suggested_category")}
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
              defaultValue={productValue(submittedValues, snapshot, "brand_name")}
              disabled={readOnly}
              list="vendor-brand-options"
              placeholder="Search or enter brand"
            />
          </label>
          <label className="field">
            <span>Product Condition</span>
            <select
              name="product_condition"
              defaultValue={productValue(submittedValues, snapshot, "product_condition", "new")}
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
            <input name="brand_request_visible" type="hidden" value="true" />
            <input
              name="brand_request"
              defaultValue={productValue(submittedValues, snapshot, "brand_request")}
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
            defaultValue={productValue(submittedValues, snapshot, "video_url")}
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
              defaultValue={productValue(submittedValues, snapshot, "price")}
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
              defaultValue={productValue(submittedValues, snapshot, "sale_price")}
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
              defaultValue={productValue(submittedValues, snapshot, "stock_quantity")}
              disabled={readOnly}
            />
          </label>
          <label className="field">
            <span>Availability</span>
            <select
              name="availability"
              defaultValue={productValue(submittedValues, snapshot, "availability", "in_stock")}
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
              defaultValue={productValue(submittedValues, snapshot, "sku")}
              disabled={readOnly}
            />
          </label>
          <label className="field">
            <span>Barcode (Optional)</span>
            <input
              name="barcode"
              defaultValue={productValue(submittedValues, snapshot, "barcode")}
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
            defaultValue={productValue(submittedValues, snapshot, "warranty")}
            disabled={readOnly}
            placeholder="1 year warranty, No warranty, etc."
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Full Description</legend>
        <ProductDescriptionEditor
          initialValue={productValue(submittedValues, snapshot, "description_en")}
          label="Product Description (English)"
          name="description_en"
          readOnly={readOnly}
        />
        <ProductDescriptionEditor
          dir="rtl"
          initialValue={productValue(submittedValues, snapshot, "description_ar")}
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
            defaultValue={productValue(submittedValues, snapshot, "intended_status", "active")}
            disabled={readOnly}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {formError ? <p className="form-error">{formError}</p> : null}
        {formState.success ? <p className="success-banner">{formState.success}</p> : null}
      </fieldset>
    </form>
  );
}
