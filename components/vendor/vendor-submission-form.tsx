"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { VendorNewProductImages } from "@/components/vendor/vendor-new-product-images";
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
  includeNewProductImages?: boolean;
  readOnly?: boolean;
  showInlineActions?: boolean;
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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span className="form-error field-error">{message}</span>;
}

function fieldClassName(message?: string) {
  return message ? "field field-invalid" : "field";
}

function errorFieldProps(field: string) {
  return {
    "data-error-field": field,
  };
}

const fieldFocusOrder = [
  "primary_image",
  "additional_images",
  "name_en",
  "name_ar",
  "short_description_en",
  "short_description_ar",
  "category_id",
  "brand_name",
  "product_condition",
  "video_url",
  "price",
  "sale_price",
  "stock_quantity",
  "availability",
  "sku",
  "barcode",
  "specifications",
  "warranty",
  "description_en",
  "description_ar",
  "intended_status",
];

function VendorSubmissionActions() {
  const { pending } = useFormStatus();
  const [intent, setIntent] = useState<"save" | "submit" | null>(null);

  return (
    <div className="submission-actions seller-submit-panel">
      <button
        className="secondary-button"
        disabled={pending}
        name="submission_intent"
        onClick={() => setIntent("save")}
        type="submit"
        value="save"
      >
        {pending && intent === "save" ? "Saving..." : "Save Draft"}
      </button>
      <button
        className="primary-button"
        disabled={pending}
        name="submission_intent"
        onClick={() => setIntent("submit")}
        type="submit"
        value="submit"
      >
        {pending && intent === "submit" ? "Submitting..." : "Submit For Review"}
      </button>
    </div>
  );
}

export function VendorSubmissionForm({
  action,
  categories,
  children,
  error,
  includeNewProductImages = false,
  readOnly = false,
  showInlineActions = false,
  snapshot,
}: VendorSubmissionFormProps) {
  const [formState, formAction] = useActionState(action, {
    error: error ?? null,
    fieldErrors: {},
    submissionId: null,
    success: null,
    values: null,
  });
  const submittedValues = formState.values;
  const fieldErrors = useMemo(() => formState.fieldErrors ?? {}, [formState.fieldErrors]);
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

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) {
      return;
    }

    const firstField =
      fieldFocusOrder.find((field) => fieldErrors[field]) ?? Object.keys(fieldErrors)[0];
    const target = document.querySelector<HTMLElement>(`[data-error-field="${firstField}"]`);

    if (!target) {
      return;
    }

    target.scrollIntoView({ block: "center", behavior: "smooth" });

    window.setTimeout(() => {
      const focusSelector = "input:not([type='hidden']),select,textarea,button,[contenteditable='true']";
      const focusTarget = target.matches(focusSelector)
        ? target
        : target.querySelector<HTMLElement>(focusSelector);

      focusTarget?.focus({ preventScroll: true });
    }, 250);
  }, [fieldErrors]);

  return (
    <form
      action={formAction}
      className="seller-product-form"
      encType="multipart/form-data"
      id="vendor-product-form"
    >
      <input name="submission_id" type="hidden" value={formState.submissionId ?? ""} />
      {includeNewProductImages ? <VendorNewProductImages fieldErrors={fieldErrors} /> : null}
      {children}

      <fieldset className="fieldset">
        <legend>Basic Product Information</legend>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.name_en)} {...errorFieldProps("name_en")}>
            <span>Product Name (English)</span>
            <input
              name="name_en"
              defaultValue={productValue(submittedValues, snapshot, "name_en")}
              disabled={readOnly}
              required
            />
            <FieldError message={fieldErrors.name_en} />
          </label>
          <label className={fieldClassName(fieldErrors.name_ar)} {...errorFieldProps("name_ar")}>
            <span>Product Name (Arabic)</span>
            <input
              name="name_ar"
              defaultValue={productValue(submittedValues, snapshot, "name_ar")}
              disabled={readOnly}
              required
              dir="rtl"
            />
            <FieldError message={fieldErrors.name_ar} />
          </label>
        </div>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.short_description_en)} {...errorFieldProps("short_description_en")}>
            <span>Short Description (English)</span>
            <textarea
              name="short_description_en"
              defaultValue={productValue(submittedValues, snapshot, "short_description_en")}
              disabled={readOnly}
              maxLength={180}
            />
            <FieldError message={fieldErrors.short_description_en} />
          </label>
          <label className={fieldClassName(fieldErrors.short_description_ar)} {...errorFieldProps("short_description_ar")}>
            <span>Short Description (Arabic)</span>
            <textarea
              name="short_description_ar"
              defaultValue={productValue(submittedValues, snapshot, "short_description_ar")}
              disabled={readOnly}
              dir="rtl"
              maxLength={180}
            />
            <FieldError message={fieldErrors.short_description_ar} />
          </label>
        </div>
        <p className="field-help">Use 20 to 180 characters for each short description.</p>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.category_id)} {...errorFieldProps("category_id")}>
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
            <FieldError message={fieldErrors.category_id} />
          </label>
          <label className={fieldClassName(fieldErrors.category_id)} {...errorFieldProps("category_id")}>
            <span>Subcategory</span>
            <input
              disabled={readOnly || !selectedCategory}
              list="vendor-subcategory-options"
              onChange={(event) => setSubcategoryInput(event.target.value)}
              placeholder={selectedCategory ? "Search and select a subcategory" : "Choose category first"}
              value={subcategoryInput}
            />
            <FieldError message={fieldErrors.category_id} />
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
          <label className={fieldClassName(fieldErrors.suggested_category)} {...errorFieldProps("suggested_category")}>
            <span>Suggested Category</span>
            <input name="suggested_category_visible" type="hidden" value="true" />
            <input
              name="suggested_category"
              defaultValue={productValue(submittedValues, snapshot, "suggested_category")}
              disabled={readOnly}
              placeholder="Tell us the category you expected"
            />
            <FieldError message={fieldErrors.suggested_category} />
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
          <label className={fieldClassName(fieldErrors.brand_name)} {...errorFieldProps("brand_name")}>
            <span>Brand</span>
            <input
              name="brand_name"
              defaultValue={productValue(submittedValues, snapshot, "brand_name")}
              disabled={readOnly}
              list="vendor-brand-options"
              placeholder="Search or enter brand"
            />
            <FieldError message={fieldErrors.brand_name} />
          </label>
          <label
            className={fieldClassName(fieldErrors.product_condition)}
            {...errorFieldProps("product_condition")}
          >
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
            <FieldError message={fieldErrors.product_condition} />
          </label>
        </div>
        <datalist id="vendor-brand-options">
          {brandSuggestions.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
        {showBrandRequest ? (
          <label className={fieldClassName(fieldErrors.brand_request)} {...errorFieldProps("brand_request")}>
            <span>Request New Brand</span>
            <input name="brand_request_visible" type="hidden" value="true" />
            <input
              name="brand_request"
              defaultValue={productValue(submittedValues, snapshot, "brand_request")}
              disabled={readOnly}
              placeholder="Enter the brand name to request"
            />
            <FieldError message={fieldErrors.brand_request} />
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
        <label className={fieldClassName(fieldErrors.video_url)} {...errorFieldProps("video_url")}>
          <span>YouTube, TikTok, or Instagram URL (Optional)</span>
          <input
            name="video_url"
            defaultValue={productValue(submittedValues, snapshot, "video_url")}
            disabled={readOnly}
            placeholder="https://..."
            type="url"
          />
          <FieldError message={fieldErrors.video_url} />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Pricing & Inventory</legend>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.price)} {...errorFieldProps("price")}>
            <span>Regular Price (KWD)</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.001"
              defaultValue={productValue(submittedValues, snapshot, "price")}
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.price} />
          </label>
          <label className={fieldClassName(fieldErrors.sale_price)} {...errorFieldProps("sale_price")}>
            <span>Sale Price (KWD)</span>
            <input
              name="sale_price"
              type="number"
              min="0"
              step="0.001"
              defaultValue={productValue(submittedValues, snapshot, "sale_price")}
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.sale_price} />
          </label>
        </div>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.stock_quantity)} {...errorFieldProps("stock_quantity")}>
            <span>Available Stock</span>
            <input
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              defaultValue={productValue(submittedValues, snapshot, "stock_quantity")}
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.stock_quantity} />
          </label>
          <label className={fieldClassName(fieldErrors.availability)} {...errorFieldProps("availability")}>
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
            <FieldError message={fieldErrors.availability} />
          </label>
        </div>
        <div className="form-grid">
          <label className={fieldClassName(fieldErrors.sku)} {...errorFieldProps("sku")}>
            <span>SKU (Optional)</span>
            <input
              name="sku"
              defaultValue={productValue(submittedValues, snapshot, "sku")}
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.sku} />
          </label>
          <label className={fieldClassName(fieldErrors.barcode)} {...errorFieldProps("barcode")}>
            <span>Barcode (Optional)</span>
            <input
              name="barcode"
              defaultValue={productValue(submittedValues, snapshot, "barcode")}
              disabled={readOnly}
            />
            <FieldError message={fieldErrors.barcode} />
          </label>
        </div>
      </fieldset>

      <fieldset
        className={fieldErrors.specifications ? "fieldset field-invalid" : "fieldset"}
        data-error-field="specifications"
      >
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
                    disabled={readOnly}
                    maxLength={80}
                    onChange={(event) =>
                      setSpecRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, key: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Weight"
                    value={spec.key}
                  />
                </label>
                <label className="field">
                  <span>Value</span>
                  <input
                    name="spec_value"
                    disabled={readOnly}
                    maxLength={180}
                    onChange={(event) =>
                      setSpecRows((rows) =>
                        rows.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, value: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="500g"
                    value={spec.value}
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
        <FieldError message={fieldErrors.specifications} />
        <label className={fieldClassName(fieldErrors.warranty)} {...errorFieldProps("warranty")}>
          <span>Warranty Information (Optional)</span>
          <input
            name="warranty"
            defaultValue={productValue(submittedValues, snapshot, "warranty")}
            disabled={readOnly}
            placeholder="1 year warranty, No warranty, etc."
          />
          <FieldError message={fieldErrors.warranty} />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Full Description</legend>
        <ProductDescriptionEditor
          error={fieldErrors.description_en}
          initialValue={productValue(submittedValues, snapshot, "description_en")}
          label="Product Description (English)"
          name="description_en"
          readOnly={readOnly}
        />
        <ProductDescriptionEditor
          dir="rtl"
          error={fieldErrors.description_ar}
          initialValue={productValue(submittedValues, snapshot, "description_ar")}
          label="Product Description (Arabic)"
          name="description_ar"
          readOnly={readOnly}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Actions</legend>
        <label className={fieldClassName(fieldErrors.intended_status)} {...errorFieldProps("intended_status")}>
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
          <FieldError message={fieldErrors.intended_status} />
        </label>

        {formError ? <p className="form-error">{formError}</p> : null}
        {formState.success ? <p className="success-banner">{formState.success}</p> : null}
      </fieldset>
      {showInlineActions && !readOnly ? <VendorSubmissionActions /> : null}
    </form>
  );
}
