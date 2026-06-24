export const productImageBucket = "product-images";
export const maxProductImageSize = 5 * 1024 * 1024;
export const minProductImageDimension = 330;
export const maxProductImageDimension = 5000;
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

function readUInt24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function parsePngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) {
    return null;
  }

  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => bytes[index] === value)) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

function parseJpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];

    if (length < 2) {
      return null;
    }

    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }

    offset += 2 + length;
  }

  return null;
}

function parseWebpDimensions(bytes: Uint8Array) {
  if (
    bytes.length < 30 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = String.fromCharCode(...bytes.slice(12, 16));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (chunkType === "VP8X" && bytes.length >= 30) {
    return {
      width: readUInt24LE(bytes, 24) + 1,
      height: readUInt24LE(bytes, 27) + 1,
    };
  }

  if (chunkType === "VP8 " && bytes.length >= 30) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && bytes.length >= 25) {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];

    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + ((b4 << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
    };
  }

  return null;
}

export async function getProductImageDimensions(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dimensions =
    file.type === "image/png"
      ? parsePngDimensions(bytes)
      : file.type === "image/jpeg"
        ? parseJpegDimensions(bytes)
        : file.type === "image/webp"
          ? parseWebpDimensions(bytes)
          : null;

  if (!dimensions) {
    throw new Error("Unable to read image dimensions.");
  }

  if (
    dimensions.width < minProductImageDimension ||
    dimensions.height < minProductImageDimension ||
    dimensions.width > maxProductImageDimension ||
    dimensions.height > maxProductImageDimension
  ) {
    throw new Error("Image dimensions must be between 330x330 and 5000x5000 pixels.");
  }

  return dimensions;
}
