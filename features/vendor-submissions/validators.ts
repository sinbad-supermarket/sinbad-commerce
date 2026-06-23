import { createSlug, normalizeSlug } from "@/lib/utils/slug";
import { productStatuses, type ProductStatus } from "@/features/products/types";
import {
  editableSubmissionStatuses,
  type ProductSubmissionSnapshot,
  type SubmissionStatus,
} from "./types";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function requiredText(value: FormDataEntryValue | null, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  return text;
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

function parsePrice(value: FormDataEntryValue | null) {
  const price = String(value ?? "").trim();

  if (!price) {
    return null;
  }

  if (!/^\d+(\.\d{1,3})?$/.test(price)) {
    throw new Error("Price must be a non-negative number with up to 3 decimal places.");
  }

  return price;
}

function parseIntendedStatus(value: FormDataEntryValue | null): ProductStatus {
  const status = String(value ?? "draft").trim();

  if (!productStatuses.includes(status as ProductStatus)) {
    throw new Error("Intended product status is invalid.");
  }

  return status as ProductStatus;
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
  const name_en = requiredText(formData.get("name_en"), "English name");
  const name_ar = requiredText(formData.get("name_ar"), "Arabic name");
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : createSlug(name_en);
  const categoryIds = uniqueValues(formData.getAll("category_ids"));
  const rawPrimaryCategoryId = optionalText(formData.get("primary_category_id"));
  const primaryCategoryId =
    rawPrimaryCategoryId || (categoryIds.length > 0 ? categoryIds[0] : null);

  if (!slug) {
    throw new Error("Slug is required.");
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
      price: parsePrice(formData.get("price")),
      intended_status: parseIntendedStatus(formData.get("intended_status")),
    },
    categories: categoryIds.map((categoryId) => ({
      category_id: categoryId,
      is_primary: categoryId === primaryCategoryId,
    })),
    images: [],
  };
}
