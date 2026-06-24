import { createSlug, normalizeSlug } from "@/lib/utils/slug";
import { productStatuses, type ProductStatus } from "@/features/products/types";
import {
  editableSubmissionStatuses,
  productAvailabilityOptions,
  productConditionOptions,
  type ProductSubmissionSnapshot,
  type SubmissionStatus,
} from "./types";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function uniqueValues(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function parseMoney(value: FormDataEntryValue | null, label: string) {
  const price = String(value ?? "").trim();

  if (!price) {
    return null;
  }

  if (!/^\d+(\.\d{1,3})?$/.test(price)) {
    throw new Error(`${label} must be a non-negative number with up to 3 decimal places.`);
  }

  return price;
}

function parseStockQuantity(value: FormDataEntryValue | null) {
  const quantity = String(value ?? "").trim();

  if (!quantity) {
    return null;
  }

  if (!/^\d+$/.test(quantity)) {
    throw new Error("Stock quantity must be a whole number.");
  }

  return Number(quantity);
}

function parseAvailability(value: FormDataEntryValue | null) {
  const availability = String(value ?? "in_stock").trim();

  if (!productAvailabilityOptions.includes(availability as (typeof productAvailabilityOptions)[number])) {
    throw new Error("Availability is invalid.");
  }

  return availability as (typeof productAvailabilityOptions)[number];
}

function parseProductCondition(value: FormDataEntryValue | null) {
  const condition = String(value ?? "new").trim();

  if (!productConditionOptions.includes(condition as (typeof productConditionOptions)[number])) {
    throw new Error("Product condition is invalid.");
  }

  return condition as (typeof productConditionOptions)[number];
}

function parseOptionalUrl(value: FormDataEntryValue | null) {
  const text = optionalText(value);

  if (!text) {
    return null;
  }

  try {
    const url = new URL(text);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Product video URL must start with http:// or https://.");
    }

    return url.toString();
  } catch {
    throw new Error("Product video URL must be a valid URL.");
  }
}

function parseIntendedStatus(value: FormDataEntryValue | null): ProductStatus {
  const status = String(value ?? "draft").trim();

  if (!productStatuses.includes(status as ProductStatus)) {
    throw new Error("Intended product status is invalid.");
  }

  return status as ProductStatus;
}

function parseSpecifications(formData: FormData) {
  const keys = formData.getAll("spec_key");
  const values = formData.getAll("spec_value");
  const specifications: Array<{ key: string; value: string }> = [];
  const length = Math.max(keys.length, values.length);

  for (let index = 0; index < length; index += 1) {
    const key = String(keys[index] ?? "").trim();
    const value = String(values[index] ?? "").trim();

    if (!key && !value) {
      continue;
    }

    if (!key || !value) {
      throw new Error("Specification key and value are both required when provided.");
    }

    if (key.length > 80) {
      throw new Error("Specification keys must be 80 characters or fewer.");
    }

    if (value.length > 180) {
      throw new Error("Specification values must be 180 characters or fewer.");
    }

    specifications.push({ key, value });
  }

  if (specifications.length > 20) {
    throw new Error("A product can have at most 20 specifications.");
  }

  return specifications;
}

export function assertSubmissionIsEditable(status: SubmissionStatus) {
  if (!editableSubmissionStatuses.includes(status as (typeof editableSubmissionStatuses)[number])) {
    throw new Error("This submission can no longer be edited.");
  }
}

export function parseSubmissionSnapshotFormData(
  formData: FormData,
  options: { requireCategories: boolean },
): ProductSubmissionSnapshot {
  const name_en = optionalText(formData.get("name_en")) ?? "";
  const name_ar = optionalText(formData.get("name_ar")) ?? "";
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : createSlug(name_en);
  const categoryIds = uniqueValues([
    ...formData.getAll("category_ids"),
    formData.get("category_id") ?? "",
    formData.get("subcategory_id") ?? "",
  ]);
  const rawPrimaryCategoryId = optionalText(formData.get("primary_category_id"));
  const primaryCategoryId =
    rawPrimaryCategoryId ||
    optionalText(formData.get("subcategory_id")) ||
    (categoryIds.length > 0 ? categoryIds[0] : null);
  const regularPrice = parseMoney(formData.get("price"), "Regular price");
  const salePrice = parseMoney(formData.get("sale_price"), "Sale price");
  const stockQuantity = parseStockQuantity(formData.get("stock_quantity"));

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (salePrice && regularPrice && Number(salePrice) >= Number(regularPrice)) {
    throw new Error("Sale price must be less than the regular price.");
  }

  if (options.requireCategories && categoryIds.length === 0) {
    throw new Error("At least one category is required before submitting for review.");
  }

  if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
    throw new Error("Primary category must be one of the assigned categories.");
  }

  return {
    version: 1,
    product: {
      slug,
      sku: optionalText(formData.get("sku")),
      barcode: optionalText(formData.get("barcode")),
      name_en,
      name_ar,
      short_description_en: optionalText(formData.get("short_description_en")),
      short_description_ar: optionalText(formData.get("short_description_ar")),
      description_en: optionalText(formData.get("description_en")),
      description_ar: optionalText(formData.get("description_ar")),
      price: regularPrice,
      sale_price: salePrice,
      brand_name: optionalText(formData.get("brand_name")),
      video_url: parseOptionalUrl(formData.get("video_url")),
      stock_quantity: stockQuantity,
      availability: parseAvailability(formData.get("availability")),
      product_condition: parseProductCondition(formData.get("product_condition")),
      specifications: parseSpecifications(formData),
      warranty: optionalText(formData.get("warranty")),
      brand_request: optionalText(formData.get("brand_request")),
      suggested_category: optionalText(formData.get("suggested_category")),
      intended_status: parseIntendedStatus(formData.get("intended_status")),
    },
    categories: categoryIds.map((categoryId) => ({
      category_id: categoryId,
      is_primary: categoryId === primaryCategoryId,
    })),
    images: [],
  };
}

export function assertSnapshotReadyForReview(snapshot: ProductSubmissionSnapshot) {
  if (!snapshot.product.name_en || !snapshot.product.name_ar) {
    throw new Error("English and Arabic product names are required before submitting.");
  }

  if (!snapshot.product.short_description_en || !snapshot.product.short_description_ar) {
    throw new Error("English and Arabic short descriptions are required before submitting.");
  }

  if (snapshot.product.short_description_en.length < 20 || snapshot.product.short_description_en.length > 180) {
    throw new Error("English short description must be 20 to 180 characters.");
  }

  if (snapshot.product.short_description_ar.length < 20 || snapshot.product.short_description_ar.length > 180) {
    throw new Error("Arabic short description must be 20 to 180 characters.");
  }

  if (!snapshot.product.description_en || !snapshot.product.description_ar) {
    throw new Error("English and Arabic full descriptions are required before submitting.");
  }

  if (!snapshot.product.price) {
    throw new Error("Regular price is required before submitting.");
  }

  if (snapshot.product.sale_price && Number(snapshot.product.sale_price) >= Number(snapshot.product.price)) {
    throw new Error("Sale price must be less than the regular price.");
  }

  if (snapshot.product.stock_quantity === null || snapshot.product.stock_quantity < 0) {
    throw new Error("Stock quantity is required before submitting.");
  }

  if (snapshot.categories.length === 0) {
    throw new Error("At least one category is required before submitting for review.");
  }

  if (snapshot.images.length < 2) {
    throw new Error("At least 2 product images are required before submitting.");
  }

  if (snapshot.images.length > 8) {
    throw new Error("A product can have at most 8 images.");
  }

  if (snapshot.images.filter((image) => image.is_primary).length !== 1) {
    throw new Error("Exactly one primary image is required before submitting.");
  }

  if (
    snapshot.images.some(
      (image) =>
        image.width === null ||
        image.height === null ||
        image.width < 330 ||
        image.height < 330 ||
        image.width > 5000 ||
        image.height > 5000,
    )
  ) {
    throw new Error("Product images must be between 330x330 and 5000x5000 pixels.");
  }
}
