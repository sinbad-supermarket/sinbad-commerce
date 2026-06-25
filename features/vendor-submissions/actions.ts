"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  extensionForMimeType,
  getProductImageDimensions,
  optionalImageText,
  parseImageSortOrder,
  productImageBucket,
  validateProductImageFile,
} from "@/features/product-images/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";
import type { ProductStatus } from "@/features/products/types";
import {
  activeUpdateSubmissionStatuses,
  type StagedSubmissionImage,
  type ProductAvailability,
  type ProductCondition,
  type ProductReviewSubmissionRow,
  type ProductSubmissionSnapshot,
} from "./types";
import {
  assertSnapshotReadyForReview,
  assertSubmissionIsEditable,
  parseSubmissionSnapshotFormData,
} from "./validators";
import {
  getVendorCanonicalProductById,
  getVendorSubmissionById,
  listVendorProductCategoryAssignments,
} from "./queries";

function submissionErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export type VendorSubmissionFormActionState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success: string | null;
  values: VendorSubmissionFormValues | null;
};

export type VendorSubmissionFormValues = {
  name_en: string;
  name_ar: string;
  short_description_en: string;
  short_description_ar: string;
  category_id: string;
  subcategory_id: string;
  primary_category_id: string;
  suggested_category: string;
  suggested_category_visible: boolean;
  brand_name: string;
  brand_request: string;
  brand_request_visible: boolean;
  product_condition: string;
  video_url: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  availability: string;
  sku: string;
  barcode: string;
  specifications: Array<{ key: string; value: string }>;
  warranty: string;
  description_en: string;
  description_ar: string;
  intended_status: string;
};

function assertVendorCanWrite(status: string) {
  if (status === "suspended") {
    throw new Error("This vendor account is suspended. Product submissions are read-only.");
  }
}

function formText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function formFlag(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

function collectSubmissionFormValues(formData: FormData): VendorSubmissionFormValues {
  const specKeys = formData.getAll("spec_key");
  const specValues = formData.getAll("spec_value");
  const specLength = Math.max(specKeys.length, specValues.length);
  const specifications = Array.from({ length: specLength }, (_, index) => ({
    key: String(specKeys[index] ?? ""),
    value: String(specValues[index] ?? ""),
  }));

  return {
    name_en: formText(formData, "name_en"),
    name_ar: formText(formData, "name_ar"),
    short_description_en: formText(formData, "short_description_en"),
    short_description_ar: formText(formData, "short_description_ar"),
    category_id: formText(formData, "category_id"),
    subcategory_id: formText(formData, "subcategory_id"),
    primary_category_id: formText(formData, "primary_category_id"),
    suggested_category: formText(formData, "suggested_category"),
    suggested_category_visible: formFlag(formData, "suggested_category_visible"),
    brand_name: formText(formData, "brand_name"),
    brand_request: formText(formData, "brand_request"),
    brand_request_visible: formFlag(formData, "brand_request_visible"),
    product_condition: formText(formData, "product_condition"),
    video_url: formText(formData, "video_url"),
    price: formText(formData, "price"),
    sale_price: formText(formData, "sale_price"),
    stock_quantity: formText(formData, "stock_quantity"),
    availability: formText(formData, "availability"),
    sku: formText(formData, "sku"),
    barcode: formText(formData, "barcode"),
    specifications,
    warranty: formText(formData, "warranty"),
    description_en: formText(formData, "description_en"),
    description_ar: formText(formData, "description_ar"),
    intended_status: formText(formData, "intended_status"),
  };
}

function friendlySubmissionError(message: string) {
  const normalized = message.toLowerCase();
  const fieldErrors: Record<string, string> = {};

  if (normalized.includes("slug is already in use") || normalized.includes("slug is required")) {
    fieldErrors.name_en =
      normalized.includes("required")
        ? "Please enter a product name."
        : "This product name creates a duplicate product URL. Please change the product name slightly.";
  } else if (normalized.includes("english and arabic product names")) {
    fieldErrors.name_en = "Please enter a product name in English.";
    fieldErrors.name_ar = "Please enter a product name in Arabic.";
  } else if (normalized.includes("english and arabic short descriptions")) {
    fieldErrors.short_description_en = "Please enter a short description in English.";
    fieldErrors.short_description_ar = "Please enter a short description in Arabic.";
  } else if (normalized.includes("english short description")) {
    fieldErrors.short_description_en = "English short description must be 20 to 180 characters.";
  } else if (normalized.includes("arabic short description")) {
    fieldErrors.short_description_ar = "Arabic short description must be 20 to 180 characters.";
  } else if (normalized.includes("full descriptions")) {
    fieldErrors.description_en = "Please enter the full product description in English.";
    fieldErrors.description_ar = "Please enter the full product description in Arabic.";
  } else if (normalized.includes("at least one category") || normalized.includes("category is required")) {
    fieldErrors.category_id = "Please choose a category.";
  } else if (normalized.includes("primary category")) {
    fieldErrors.category_id = "Please choose a valid category and subcategory.";
  } else if (normalized.includes("regular price is required")) {
    fieldErrors.price = "Please enter a regular price.";
  } else if (normalized.includes("regular price must")) {
    fieldErrors.price = "Regular price must be a valid non-negative amount.";
  } else if (normalized.includes("sale price")) {
    fieldErrors.sale_price = "Sale price must be lower than regular price.";
  } else if (normalized.includes("stock quantity") || normalized.includes("stock")) {
    fieldErrors.stock_quantity = "Please enter available stock as a whole number.";
  } else if (normalized.includes("sku")) {
    fieldErrors.sku = "This SKU already exists for one of your products.";
  } else if (normalized.includes("barcode")) {
    fieldErrors.barcode = "Please check the barcode.";
  } else if (normalized.includes("one primary image") || normalized.includes("primary image")) {
    fieldErrors.primary_image = "Please upload one primary image.";
  } else if (normalized.includes("additional image")) {
    fieldErrors.additional_images = "Please upload at least one additional image.";
  } else if (normalized.includes("at least 2 product images")) {
    fieldErrors.additional_images = "Please upload at least one additional image.";
  } else if (normalized.includes("up to 7 additional images")) {
    fieldErrors.additional_images = "You can upload up to 7 additional images.";
  } else if (normalized.includes("up to 8 images")) {
    fieldErrors.additional_images = "You can upload up to 8 images total.";
  } else if (normalized.includes("image must be between")) {
    fieldErrors.primary_image = "Image must be between 330x330 and 5000x5000 pixels.";
  } else if (normalized.includes("image must be jpg")) {
    fieldErrors.primary_image = "Image must be JPG, JPEG, PNG, or WebP.";
  } else if (normalized.includes("image must be 5 mb")) {
    fieldErrors.primary_image = "Image must be 5 MB or smaller.";
  } else if (normalized.includes("specification")) {
    fieldErrors.specifications = "Please complete or remove the highlighted specification row.";
  } else if (normalized.includes("video url")) {
    fieldErrors.video_url = "Please enter a valid YouTube, TikTok, or Instagram URL.";
  }

  return {
    fieldErrors,
    message:
      Object.keys(fieldErrors).length > 0
        ? "Please check the highlighted fields."
        : message || "Please check the form and try again.",
  };
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage product submissions.");
  }

  return user.id;
}

async function assertCategoriesExist(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("is_active", true)
    .in("id", categoryIds);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== categoryIds.length) {
    throw new Error("One or more selected categories are unavailable.");
  }
}

async function assertCanonicalFieldIsAvailable(
  field: "slug" | "sku",
  value: string | null,
  vendorId: string,
  currentProductId?: string | null,
) {
  if (!value) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "is_canonical_product_field_available",
    {
      p_field: field,
      p_value: value,
      p_exclude_product_id: currentProductId ?? null,
      p_vendor_id: vendorId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      field === "sku"
        ? "This SKU already exists for one of your products."
        : "Slug is already in use.",
    );
  }
}

async function assertSnapshotIsAvailable(
  snapshot: ProductSubmissionSnapshot,
  vendorId: string,
  currentProductId?: string | null,
) {
  await assertCanonicalFieldIsAvailable("slug", snapshot.product.slug, vendorId, currentProductId);
  await assertCanonicalFieldIsAvailable("sku", snapshot.product.sku, vendorId, currentProductId);
}

function categoryIdsFromSnapshot(snapshot: ProductSubmissionSnapshot) {
  return snapshot.categories.map((category) => category.category_id);
}

function optionalProductImageFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function newProductSubmissionImageFiles(formData: FormData) {
  return {
    primary: optionalProductImageFile(formData.get("primary_image")),
    additional: formData
      .getAll("additional_images")
      .map((value) => optionalProductImageFile(value))
      .filter((file): file is File => Boolean(file)),
  };
}

type PreparedStagedSubmissionImage = {
  file: File;
  image: StagedSubmissionImage;
};

async function prepareNewSubmissionImages(
  vendorId: string,
  submissionId: string,
  formData: FormData,
) {
  const files = newProductSubmissionImageFiles(formData);
  const preparedImages: PreparedStagedSubmissionImage[] = [];

  if (files.additional.length > 7) {
    throw new Error("You can upload up to 7 additional images.");
  }

  const orderedFiles = [
    ...(files.primary ? [{ file: files.primary, isPrimary: true, sortOrder: 0 }] : []),
    ...files.additional.map((file, index) => ({
      file,
      isPrimary: false,
      sortOrder: index + 1,
    })),
  ];

  if (orderedFiles.length > 8) {
    throw new Error("You can upload up to 8 images total.");
  }

  for (const item of orderedFiles) {
    const file = validateProductImageFile(item.file);
    const dimensions = await getProductImageDimensions(file);
    const imageId = randomUUID();
    const extension = extensionForMimeType(file.type);
    const storagePath = `vendor-submissions/${vendorId}/${submissionId}/${imageId}.${extension}`;

    preparedImages.push({
      file,
      image: {
        id: imageId,
        storage_path: storagePath,
        alt_text_en: null,
        alt_text_ar: null,
        sort_order: item.sortOrder,
        is_primary: item.isPrimary,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
      },
    });
  }

  return preparedImages;
}

async function uploadPreparedSubmissionImages(preparedImages: PreparedStagedSubmissionImage[]) {
  const supabase = await createSupabaseServerClient();
  const uploadedPaths: string[] = [];

  try {
    for (const preparedImage of preparedImages) {
      const { error } = await supabase.storage
        .from(productImageBucket)
        .upload(preparedImage.image.storage_path, preparedImage.file, {
          contentType: preparedImage.file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      uploadedPaths.push(preparedImage.image.storage_path);
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(productImageBucket).remove(uploadedPaths);
    }

    throw error;
  }
}

function submissionDetailPath(submissionId: string) {
  return `/vendor/products/submissions/${submissionId}`;
}

function blankSubmissionSnapshot(slug: string): ProductSubmissionSnapshot {
  return {
    version: 1,
    product: {
      slug,
      sku: null,
      barcode: null,
      name_en: "",
      name_ar: "",
      short_description_en: null,
      short_description_ar: null,
      description_en: null,
      description_ar: null,
      price: null,
      sale_price: null,
      brand_name: null,
      video_url: null,
      stock_quantity: null,
      availability: "in_stock",
      product_condition: "new",
      specifications: [],
      warranty: null,
      brand_request: null,
      suggested_category: null,
      intended_status: "active",
    },
    categories: [],
    images: [],
  };
}

function snapshotFromCanonicalProduct(
  product: {
    slug: string;
    sku: string | null;
    barcode: string | null;
    name_en: string;
    name_ar: string;
    short_description_en: string | null;
    short_description_ar: string | null;
    description_en: string | null;
    description_ar: string | null;
    price: string | number | null;
    sale_price?: string | number | null;
    brand_name?: string | null;
    video_url?: string | null;
    stock_quantity?: number | null;
    availability?: string | null;
    product_condition?: string | null;
    specifications?: Array<{ key: string; value: string }> | null;
    warranty?: string | null;
    status: string;
  },
  assignments: Array<{ category_id: string; is_primary: boolean }>,
): ProductSubmissionSnapshot {
  return {
    version: 1,
    product: {
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode,
      name_en: product.name_en,
      name_ar: product.name_ar,
      short_description_en: product.short_description_en,
      short_description_ar: product.short_description_ar,
      description_en: product.description_en,
      description_ar: product.description_ar,
      price:
        product.price === null || product.price === undefined ? null : String(product.price),
      sale_price:
        product.sale_price === null || product.sale_price === undefined
          ? null
          : String(product.sale_price),
      brand_name: product.brand_name ?? null,
      video_url: product.video_url ?? null,
      stock_quantity: product.stock_quantity ?? null,
      availability:
        product.availability === "out_of_stock" || product.availability === "preorder"
          ? product.availability
          : ("in_stock" satisfies ProductAvailability),
      product_condition:
        product.product_condition === "refurbished" || product.product_condition === "used"
          ? product.product_condition
          : ("new" satisfies ProductCondition),
      specifications: product.specifications ?? [],
      warranty: product.warranty ?? null,
      brand_request: null,
      suggested_category: null,
      intended_status: product.status as ProductStatus,
    },
    categories: assignments.map((assignment) => ({
      category_id: assignment.category_id,
      is_primary: assignment.is_primary,
    })),
    images: [],
  };
}

async function assertOwnEditableSubmission(
  submission: ProductReviewSubmissionRow,
  userId: string,
) {
  if (submission.submitted_by !== userId) {
    throw new Error("Only the original submitter can edit this submission.");
  }

  assertSubmissionIsEditable(submission.status);
}

async function getOwnEditableSubmissionForSelectedVendor(submissionId: string) {
  const { currentVendor } = await requireSelectedVendor();
  assertVendorCanWrite(currentVendor.vendor.status);

  const userId = await getCurrentUserId();
  const submission = await getVendorSubmissionById(
    submissionId,
    currentVendor.vendor.id,
  );

  if (!submission) {
    throw new Error("Submission was not found.");
  }

  await assertOwnEditableSubmission(submission, userId);

  return {
    currentVendor,
    submission,
  };
}

async function updateSubmissionSnapshot(
  submissionId: string,
  vendorId: string,
  snapshot: ProductSubmissionSnapshot,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("product_review_submissions")
    .update({
      snapshot,
      status: "draft",
    })
    .eq("id", submissionId)
    .eq("vendor_id", vendorId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createProductSubmissionDraft(formData: FormData) {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const snapshot = parseSubmissionSnapshotFormData(formData, {
      requireCategories: false,
    });
    await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
    await assertSnapshotIsAvailable(snapshot, currentVendor.vendor.id);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products/new",
      error instanceof Error ? error.message : "Unable to create submission draft.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function createNewProductSubmission(
  _previousState: VendorSubmissionFormActionState,
  formData: FormData,
): Promise<VendorSubmissionFormActionState> {
  const { currentVendor } = await requireSelectedVendor();
  const shouldSubmit = formData.get("submission_intent") === "submit";
  const submittedValues = collectSubmissionFormValues(formData);
  let submissionId: string | null = null;
  let insertedSubmission = false;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    if (
      !shouldSubmit &&
      !String(formData.get("slug") ?? "").trim() &&
      !String(formData.get("name_en") ?? "").trim()
    ) {
      formData.set("slug", `draft-${randomUUID()}`);
    }

    const snapshot = parseSubmissionSnapshotFormData(formData, {
      requireCategories: false,
    });
    submissionId = randomUUID();
    const preparedImages = await prepareNewSubmissionImages(
      currentVendor.vendor.id,
      submissionId,
      formData,
    );

    snapshot.images = preparedImages.map((preparedImage) => preparedImage.image);

    await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
    await assertSnapshotIsAvailable(snapshot, currentVendor.vendor.id);

    if (shouldSubmit) {
      assertSnapshotReadyForReview(snapshot);
    }

    const supabase = await createSupabaseServerClient();
    const initialSnapshot = {
      ...snapshot,
      images: [],
    };
    const { error } = await supabase
      .from("product_review_submissions")
      .insert({
        id: submissionId,
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot: initialSnapshot,
      });

    if (error) {
      throw new Error(error.message);
    }

    insertedSubmission = true;

    if (preparedImages.length > 0) {
      await uploadPreparedSubmissionImages(preparedImages);
      await updateSubmissionSnapshot(submissionId, currentVendor.vendor.id, snapshot);
    }

    if (shouldSubmit) {
      const { error: submitError } = await supabase.rpc(
        "submit_vendor_product_review_submission",
        {
          p_submission_id: submissionId,
        },
      );

      if (submitError) {
        throw new Error(submitError.message);
      }
    }
  } catch (error) {
    const rawMessage =
      error instanceof Error
        ? error.message
        : shouldSubmit
          ? "Unable to submit for review."
          : "Unable to save product draft.";
    const { fieldErrors, message } = friendlySubmissionError(rawMessage);

    if (insertedSubmission && submissionId) {
      redirect(`${submissionDetailPath(submissionId)}?error=${encodeURIComponent(message)}`);
    }

    return {
      error: message,
      fieldErrors,
      success: null,
      values: submittedValues,
    };
  }

  if (shouldSubmit) {
    redirect("/vendor/products");
  }

  if (submissionId) {
    redirect(submissionDetailPath(submissionId));
  }

  return {
    error: null,
    fieldErrors: {},
    success: "Draft saved.",
    values: null,
  };
}

export async function createBlankProductSubmissionDraft() {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const snapshot = blankSubmissionSnapshot(`draft-${randomUUID()}`);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to create product workspace.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function updateProductSubmissionDraft(
  submissionId: string,
  _previousState: VendorSubmissionFormActionState,
  formData: FormData,
): Promise<VendorSubmissionFormActionState> {
  const { currentVendor } = await requireSelectedVendor();
  const shouldSubmit = formData.get("submission_intent") === "submit";
  const submittedValues = collectSubmissionFormValues(formData);

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const submission = await getVendorSubmissionById(
      submissionId,
      currentVendor.vendor.id,
    );

    if (!submission) {
      throw new Error("Submission was not found.");
    }

    await assertOwnEditableSubmission(submission, userId);

    const snapshot = parseSubmissionSnapshotFormData(formData, {
      requireCategories: false,
    });
    snapshot.images = submission.snapshot.images;
    await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
    await assertSnapshotIsAvailable(snapshot, currentVendor.vendor.id, submission.product_id);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("product_review_submissions")
      .update({
        snapshot,
        status: "draft",
      })
      .eq("id", submissionId)
      .eq("vendor_id", currentVendor.vendor.id);

    if (error) {
      throw new Error(error.message);
    }

    if (shouldSubmit) {
      assertSnapshotReadyForReview(snapshot);
      await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
      await assertSnapshotIsAvailable(
        snapshot,
        currentVendor.vendor.id,
        submission.product_id,
      );

      const { error: submitError } = await supabase.rpc(
        "submit_vendor_product_review_submission",
        {
          p_submission_id: submissionId,
        },
      );

      if (submitError) {
        throw new Error(submitError.message);
      }
    }
  } catch (error) {
    const rawMessage =
      error instanceof Error
        ? error.message
        : shouldSubmit
          ? "Unable to submit for review."
          : "Unable to update submission draft.";
    const { fieldErrors, message } = friendlySubmissionError(rawMessage);

    return {
      error: message,
      fieldErrors,
      success: null,
      values: submittedValues,
    };
  }

  if (shouldSubmit) {
    redirect("/vendor/products");
  }

  return {
    error: null,
    fieldErrors: {},
    success: "Draft saved.",
    values: null,
  };
}

export async function uploadSubmissionImage(submissionId: string, formData: FormData) {
  let storagePath: string | null = null;
  let replacedPrimaryStoragePath: string | null = null;

  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    const file = validateProductImageFile(formData.get("image"));
    const imageRole = formData.get("image_role") === "primary" ? "primary" : "additional";
    const replacingPrimaryImage = submission.snapshot.images.find((image) => image.is_primary);
    const imageCountAfterUpload =
      imageRole === "primary" && replacingPrimaryImage
        ? submission.snapshot.images.length
        : submission.snapshot.images.length + 1;

    if (imageCountAfterUpload > 8) {
      throw new Error("You can upload up to 8 images total.");
    }

    const dimensions = await getProductImageDimensions(file);
    const imageId = randomUUID();
    const extension = extensionForMimeType(file.type);
    storagePath = `vendor-submissions/${currentVendor.vendor.id}/${submission.id}/${imageId}.${extension}`;
    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from(productImageBucket)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const remainingImages =
      imageRole === "primary"
        ? submission.snapshot.images.filter((image) => {
            if (!image.is_primary) {
              return true;
            }

            replacedPrimaryStoragePath = image.storage_path;
            return false;
          })
        : submission.snapshot.images;
    const nextAdditionalSortOrder =
      remainingImages
        .filter((image) => !image.is_primary)
        .reduce((max, image) => Math.max(max, image.sort_order), 0) + 1;
    const nextImages = [
      ...remainingImages.map((image) => ({
        ...image,
        is_primary: imageRole === "primary" ? false : image.is_primary,
      })),
      {
        id: imageId,
        storage_path: storagePath,
        alt_text_en: optionalImageText(formData.get("alt_text_en")),
        alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
        sort_order:
          formData.get("sort_order") === null
            ? imageRole === "primary"
              ? 0
              : nextAdditionalSortOrder
            : parseImageSortOrder(formData.get("sort_order")),
        is_primary: imageRole === "primary",
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
      },
    ];

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: nextImages,
    });

    if (replacedPrimaryStoragePath) {
      await supabase.storage.from(productImageBucket).remove([replacedPrimaryStoragePath]);
    }
  } catch (error) {
    if (storagePath) {
      const supabase = await createSupabaseServerClient();
      await supabase.storage.from(productImageBucket).remove([storagePath]);
    }

    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to upload image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function updateSubmissionImage(
  submissionId: string,
  imageId: string,
  formData: FormData,
) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    let foundImage = false;
    const nextImages = submission.snapshot.images.map((image) => {
      if (image.id !== imageId) {
        return image;
      }

      foundImage = true;
      return {
        ...image,
        alt_text_en: optionalImageText(formData.get("alt_text_en")),
        alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
        sort_order: parseImageSortOrder(formData.get("sort_order")),
      };
    });

    if (!foundImage) {
      throw new Error("Staged image was not found.");
    }

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: nextImages,
    });
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to update staged image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function makeSubmissionImagePrimary(
  submissionId: string,
  imageId: string,
) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);

    if (!submission.snapshot.images.some((image) => image.id === imageId)) {
      throw new Error("Staged image was not found.");
    }

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: submission.snapshot.images.map((image) => ({
        ...image,
        is_primary: image.id === imageId,
      })),
    });
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to set primary image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function deleteSubmissionImage(submissionId: string, imageId: string) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    const image = submission.snapshot.images.find((item) => item.id === imageId);

    if (!image) {
      throw new Error("Staged image was not found.");
    }

    const supabase = await createSupabaseServerClient();
    const { error: storageError } = await supabase.storage
      .from(productImageBucket)
      .remove([image.storage_path]);

    if (storageError) {
      throw new Error(storageError.message);
    }

    const nextImages = submission.snapshot.images.filter((item) => item.id !== imageId);

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: nextImages,
    });
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to delete image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function submitProductSubmissionForReview(submissionId: string) {
  const { currentVendor } = await requireSelectedVendor();

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const submission = await getVendorSubmissionById(
      submissionId,
      currentVendor.vendor.id,
    );

    if (!submission) {
      throw new Error("Submission was not found.");
    }

    await assertOwnEditableSubmission(submission, userId);

    assertSnapshotReadyForReview(submission.snapshot);
    await assertCategoriesExist(categoryIdsFromSnapshot(submission.snapshot));
    await assertSnapshotIsAvailable(
      submission.snapshot,
      currentVendor.vendor.id,
      submission.product_id,
    );

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc(
      "submit_vendor_product_review_submission",
      {
        p_submission_id: submissionId,
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    submissionErrorRedirect(
      `/vendor/products/submissions/${submissionId}`,
      error instanceof Error ? error.message : "Unable to submit for review.",
    );
  }

  redirect("/vendor/products");
}

export async function cancelDraftSubmission(submissionId: string) {
  const { currentVendor } = await requireSelectedVendor();

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const submission = await getVendorSubmissionById(
      submissionId,
      currentVendor.vendor.id,
    );

    if (!submission) {
      throw new Error("Submission was not found.");
    }

    if (submission.submitted_by !== userId || submission.status !== "draft") {
      throw new Error("Only your draft products can be deleted.");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("product_review_submissions")
      .update({ status: "cancelled" })
      .eq("id", submissionId)
      .eq("vendor_id", currentVendor.vendor.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to delete draft.",
    );
  }

  redirect("/vendor/products");
}

export async function createUpdateSubmissionFromProduct(productId: string) {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const product = await getVendorCanonicalProductById(
      productId,
      currentVendor.vendor.id,
    );

    if (!product) {
      throw new Error("Product was not found.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: activeSubmissions, error: activeSubmissionError } = await supabase
      .from("product_review_submissions")
      .select("id")
      .eq("vendor_id", currentVendor.vendor.id)
      .eq("product_id", productId)
      .eq("change_type", "update")
      .in("status", [...activeUpdateSubmissionStatuses])
      .limit(1);

    if (activeSubmissionError) {
      throw new Error(activeSubmissionError.message);
    }

    if (activeSubmissions && activeSubmissions.length > 0) {
      throw new Error("This product already has an active update submission.");
    }

    const assignments = await listVendorProductCategoryAssignments(
      productId,
      currentVendor.vendor.id,
    );
    const snapshot = snapshotFromCanonicalProduct(product, assignments);
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: productId,
        submitted_by: userId,
        change_type: "update",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to create update submission.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function duplicateProductAsDraft(productId: string) {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const product = await getVendorCanonicalProductById(
      productId,
      currentVendor.vendor.id,
    );

    if (!product) {
      throw new Error("Product was not found.");
    }

    const assignments = await listVendorProductCategoryAssignments(
      productId,
      currentVendor.vendor.id,
    );
    const snapshot = snapshotFromCanonicalProduct(product, assignments);
    snapshot.product.slug = `${product.slug}-${randomUUID().slice(0, 8)}`;
    snapshot.product.sku = null;
    snapshot.product.barcode = null;
    snapshot.product.name_en = `${product.name_en} Copy`;
    snapshot.product.name_ar = `${product.name_ar} نسخة`;
    snapshot.images = [];

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to duplicate product.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}
