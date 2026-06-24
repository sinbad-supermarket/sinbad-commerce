"use client";

import { useState } from "react";
import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";

type VendorSubmissionImagesProps = {
  canEdit: boolean;
  images: StagedSubmissionImageListItem[];
  onDelete: (imageId: string) => () => void | Promise<void>;
  onMakePrimary: (imageId: string) => () => void | Promise<void>;
  onUpdate: (imageId: string) => (formData: FormData) => void | Promise<void>;
  uploadAction: (formData: FormData) => void | Promise<void>;
};

const minDimension = 330;
const maxDimension = 5000;

function formatFileSize(fileSize: number | null) {
  if (!fileSize) {
    return "Unknown";
  }

  return `${(fileSize / 1024).toFixed(1)} KB`;
}

function sortedImages(images: StagedSubmissionImageListItem[]) {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }

    return a.sort_order - b.sort_order;
  });
}

export function VendorSubmissionImages({
  canEdit,
  images,
  onDelete,
  onMakePrimary,
  onUpdate,
  uploadAction,
}: VendorSubmissionImagesProps) {
  const [clientError, setClientError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const orderedImages = sortedImages(images);

  function validateClientImage(file: File | undefined) {
    setClientError(null);
    setPreviewUrl(null);

    if (!file) {
      return;
    }

    if (images.length >= 8) {
      setClientError("A product can have at most 8 images. Delete one before uploading another.");
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (
        image.width < minDimension ||
        image.height < minDimension ||
        image.width > maxDimension ||
        image.height > maxDimension
      ) {
        setClientError("Image dimensions must be between 330x330 and 5000x5000 pixels.");
        URL.revokeObjectURL(url);
        return;
      }

      setPreviewUrl(url);
    };
    image.onerror = () => {
      setClientError("Unable to preview this image. Please choose another file.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Product Images</h2>
        <p className="field-help">
          Upload 2 to 8 private staged images. Images publish only after admin approval.
          Use JPEG, PNG, or WebP up to 5 MB, between 330x330 and 5000x5000 pixels.
          To replace an image, delete it and upload the replacement.
        </p>
      </div>

      <div className="image-count-row">
        <span className={images.length >= 2 ? "status-active" : "status-muted"}>
          {images.length}/8 images
        </span>
        <span className="field-help">Minimum 2 images required before review.</span>
      </div>

      {canEdit ? (
        <form className="admin-form wide-form" action={uploadAction}>
          <label className="field">
            <span>Image</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              name="image"
              onChange={(event) => validateClientImage(event.target.files?.[0])}
              required
              type="file"
            />
          </label>
          {previewUrl ? (
            <div className="image-upload-preview">
              <img alt="Selected upload preview" src={previewUrl} />
            </div>
          ) : null}
          {clientError ? <p className="form-error">{clientError}</p> : null}
          <div className="form-grid">
            <label className="field">
              <span>English alt text</span>
              <input name="alt_text_en" />
            </label>
            <label className="field">
              <span>Arabic alt text</span>
              <input name="alt_text_ar" dir="rtl" />
            </label>
          </div>
          <label className="field">
            <span>Sort order</span>
            <input name="sort_order" defaultValue={images.length} required />
          </label>
          <button className="primary-button" disabled={images.length >= 8} type="submit">
            Upload staged image
          </button>
        </form>
      ) : null}

      {orderedImages.length === 0 ? (
        <p className="empty-state">No staged images are attached to this submission.</p>
      ) : (
        <div className="image-card-grid">
          {orderedImages.map((image) => (
            <article className="image-card" key={image.id}>
              <div className="image-card-preview">
                {image.is_primary ? <span className="primary-image-badge">★ Primary</span> : null}
                {image.signedUrl ? (
                  <a href={image.signedUrl} rel="noreferrer" target="_blank">
                    <img
                      alt={image.alt_text_en ?? image.alt_text_ar ?? "Staged product image"}
                      src={image.signedUrl}
                    />
                  </a>
                ) : (
                  <span>Preview unavailable</span>
                )}
              </div>

              <form className="image-details" action={onUpdate(image.id)}>
                <div className="image-meta">
                  <span className={image.is_primary ? "status-active" : "status-muted"}>
                    {image.is_primary ? "Primary" : "Secondary"}
                  </span>
                  <span>{image.width ?? "?"}x{image.height ?? "?"}</span>
                  <span>{formatFileSize(image.file_size)}</span>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>English alt text</span>
                    <input
                      name="alt_text_en"
                      defaultValue={image.alt_text_en ?? ""}
                      disabled={!canEdit}
                    />
                  </label>
                  <label className="field">
                    <span>Arabic alt text</span>
                    <input
                      name="alt_text_ar"
                      defaultValue={image.alt_text_ar ?? ""}
                      disabled={!canEdit}
                      dir="rtl"
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Sort order</span>
                  <input
                    name="sort_order"
                    defaultValue={image.sort_order}
                    disabled={!canEdit}
                    required
                  />
                </label>

                {canEdit ? (
                  <div className="button-row">
                    <button className="primary-button" type="submit">
                      Save
                    </button>
                    {!image.is_primary ? (
                      <button
                        className="secondary-button"
                        formAction={onMakePrimary(image.id)}
                        type="submit"
                      >
                        Set primary
                      </button>
                    ) : null}
                    <button
                      className="danger-button"
                      formAction={onDelete(image.id)}
                      type="submit"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
