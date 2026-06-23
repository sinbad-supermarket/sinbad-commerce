export const productImageBucket = "product-images";
export const maxProductImageSize = 5 * 1024 * 1024;
export const allowedProductImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedProductImageMimeType =
  (typeof allowedProductImageMimeTypes)[number];

export function parseImageSortOrder(value: FormDataEntryValue | null) {
  const sortOrderText = String(value ?? "").trim();

  if (!/^-?\d+$/.test(sortOrderText)) {
    throw new Error("Sort order must be a whole number.");
  }

  return Number(sortOrderText);
}

export function optionalImageText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export function validateProductImageFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Image file is required.");
  }

  if (value.size > maxProductImageSize) {
    throw new Error("Image file must be 5 MB or smaller.");
  }

  if (!allowedProductImageMimeTypes.includes(value.type as AllowedProductImageMimeType)) {
    throw new Error("Image file must be JPEG, PNG, or WebP.");
  }

  return value;
}

export function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Image file type is not supported.");
  }
}
