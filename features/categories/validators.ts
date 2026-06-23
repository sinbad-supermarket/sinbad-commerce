import { createSlug, normalizeSlug } from "@/lib/utils/slug";

export type CategoryInput = {
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

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

export function parseCategoryFormData(formData: FormData): CategoryInput {
  const name_en = requiredText(formData.get("name_en"), "English name");
  const name_ar = requiredText(formData.get("name_ar"), "Arabic name");
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : createSlug(name_en);
  const sortOrderText = String(formData.get("sort_order") ?? "0").trim();
  const parent_id = optionalText(formData.get("parent_id"));

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (!/^-?\d+$/.test(sortOrderText)) {
    throw new Error("Sort order must be a whole number.");
  }

  const sort_order = Number(sortOrderText);

  return {
    name_en,
    name_ar,
    description_en: optionalText(formData.get("description_en")),
    description_ar: optionalText(formData.get("description_ar")),
    slug,
    parent_id,
    sort_order,
    is_active: formData.get("is_active") === "on",
  };
}
