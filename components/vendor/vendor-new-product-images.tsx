"use client";

import { useEffect, useRef, useState } from "react";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;
const minDimension = 330;
const maxDimension = 5000;

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

function syncInputFiles(input: HTMLInputElement | null, files: File[]) {
  if (!input) {
    return;
  }

  const transfer = new DataTransfer();

  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function formatFileSize(size: number) {
  return `${(size / 1024).toFixed(1)} KB`;
}

function validateFileBasics(file: File) {
  if (!allowedMimeTypes.includes(file.type)) {
    return "Image must be JPG, JPEG, PNG, or WebP.";
  }

  if (file.size > maxImageSize) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

function loadImageDimensions(previewUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Image dimensions are invalid."));
    image.src = previewUrl;
  });
}

async function buildLocalImage(file: File) {
  const basicError = validateFileBasics(file);

  if (basicError) {
    throw new Error(basicError);
  }

  const previewUrl = URL.createObjectURL(file);

  try {
    const dimensions = await loadImageDimensions(previewUrl);

    if (
      dimensions.width < minDimension ||
      dimensions.height < minDimension ||
      dimensions.width > maxDimension ||
      dimensions.height > maxDimension
    ) {
      throw new Error("Image must be between 330x330 and 5000x5000 pixels.");
    }

    return {
      id: crypto.randomUUID(),
      file,
      previewUrl,
      width: dimensions.width,
      height: dimensions.height,
    } satisfies LocalImage;
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

type VendorNewProductImagesProps = {
  fieldErrors?: Record<string, string>;
};

export function VendorNewProductImages({ fieldErrors = {} }: VendorNewProductImagesProps) {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const [primaryImage, setPrimaryImage] = useState<LocalImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<LocalImage[]>([]);
  const primaryImageRef = useRef<LocalImage | null>(null);
  const additionalImagesRef = useRef<LocalImage[]>([]);
  const [primaryDragging, setPrimaryDragging] = useState(false);
  const [additionalDragging, setAdditionalDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    primaryImageRef.current = primaryImage;
  }, [primaryImage]);

  useEffect(() => {
    additionalImagesRef.current = additionalImages;
  }, [additionalImages]);

  useEffect(() => {
    return () => {
      if (primaryImageRef.current) {
        URL.revokeObjectURL(primaryImageRef.current.previewUrl);
      }

      additionalImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function setPrimaryFile(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const nextImage = await buildLocalImage(file);

      setError(null);
      setPrimaryImage((currentImage) => {
        if (currentImage) {
          URL.revokeObjectURL(currentImage.previewUrl);
        }

        syncInputFiles(primaryInputRef.current, [nextImage.file]);
        return nextImage;
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
      syncInputFiles(primaryInputRef.current, primaryImage ? [primaryImage.file] : []);
    }
  }

  async function addAdditionalFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const availableSlots = 7 - additionalImages.length;

    if (availableSlots <= 0) {
      setError("You can upload up to 8 images total.");
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    try {
      const nextImages = await Promise.all(filesToAdd.map((file) => buildLocalImage(file)));

      setError(null);
      setAdditionalImages((currentImages) => {
        const combined = [...currentImages, ...nextImages];
        syncInputFiles(
          additionalInputRef.current,
          combined.map((image) => image.file),
        );
        return combined;
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
      nextTickSyncAdditionalInput(additionalImages);
    }
  }

  function nextTickSyncAdditionalInput(images: LocalImage[]) {
    window.requestAnimationFrame(() => {
      syncInputFiles(
        additionalInputRef.current,
        images.map((image) => image.file),
      );
    });
  }

  function removePrimaryImage() {
    setPrimaryImage((currentImage) => {
      if (currentImage) {
        URL.revokeObjectURL(currentImage.previewUrl);
      }

      syncInputFiles(primaryInputRef.current, []);
      return null;
    });
  }

  function removeAdditionalImage(imageId: string) {
    setAdditionalImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      const nextImages = currentImages.filter((image) => image.id !== imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      syncInputFiles(
        additionalInputRef.current,
        nextImages.map((image) => image.file),
      );
      return nextImages;
    });
  }

  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Product Images</h2>
        <p className="field-help">
          Images stay private and local until you save or submit this product.
        </p>
      </div>

      <div className="image-count-row">
        <span className={primaryImage && additionalImages.length >= 1 ? "status-active" : "status-muted"}>
          {(primaryImage ? 1 : 0) + additionalImages.length}/8 images
        </span>
        <span className="field-help">Minimum 1 primary image and 1 additional image.</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="seller-image-section">
        <div>
          <h3>Primary Image</h3>
          <p className="field-help">This will be the main image of your product.</p>
        </div>
        <div className="seller-upload-form">
          <label
            className={`seller-upload-zone${primaryDragging ? " is-dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setPrimaryDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setPrimaryDragging(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setPrimaryDragging(false);
              void setPrimaryFile(event.dataTransfer.files.item(0));
            }}
          >
            <input
              accept="image/jpeg,image/png,image/webp"
              name="primary_image"
              onChange={(event) => void setPrimaryFile(event.target.files?.item(0) ?? null)}
              ref={primaryInputRef}
              type="file"
            />
            <span className="seller-upload-icon">+</span>
            <strong>{primaryImage ? "Replace primary image" : "Upload primary image"}</strong>
            <span>Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB. 330x330 to 5000x5000 pixels.</span>
          </label>
          {primaryImage ? (
            <div className="seller-thumbnail-grid seller-thumbnail-grid-compact">
              <LocalImageThumbnail
                image={primaryImage}
                isPrimary
                onDelete={() => removePrimaryImage()}
              />
            </div>
          ) : (
            <p className="empty-state">Please upload one primary image.</p>
          )}
          {fieldErrors.primary_image ? (
            <p className="form-error field-error">{fieldErrors.primary_image}</p>
          ) : null}
        </div>
      </section>

      <section className="seller-image-section">
        <div>
          <h3>Additional Images</h3>
          <p className="field-help">Add 1-7 images.</p>
        </div>
        <div className="image-count-row">
          <span className={additionalImages.length >= 1 ? "status-active" : "status-muted"}>
            {additionalImages.length} / 7 images
          </span>
        </div>
        <div className="seller-upload-form">
          <label
            className={`seller-upload-zone${additionalDragging ? " is-dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setAdditionalDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setAdditionalDragging(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setAdditionalDragging(false);
              void addAdditionalFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <input
              accept="image/jpeg,image/png,image/webp"
              multiple
              name="additional_images"
              onChange={(event) => void addAdditionalFiles(Array.from(event.target.files ?? []))}
              ref={additionalInputRef}
              type="file"
            />
            <span className="seller-upload-icon">+</span>
            <strong>Upload additional images</strong>
            <span>Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB each. 330x330 to 5000x5000 pixels.</span>
          </label>
          {additionalImages.length > 0 ? (
            <div className="seller-thumbnail-grid">
              {additionalImages.map((image) => (
                <LocalImageThumbnail
                  image={image}
                  key={image.id}
                  onDelete={() => removeAdditionalImage(image.id)}
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">Please upload at least one additional image.</p>
          )}
          {fieldErrors.additional_images ? (
            <p className="form-error field-error">{fieldErrors.additional_images}</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}

function LocalImageThumbnail({
  image,
  isPrimary = false,
  onDelete,
}: {
  image: LocalImage;
  isPrimary?: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="seller-thumbnail-card">
      <div className="seller-thumbnail-preview">
        {isPrimary ? (
          <span aria-label="Primary image" className="seller-primary-star">
            ★
          </span>
        ) : null}
        <button
          aria-label="Delete image"
          className="icon-button danger-icon-button seller-trash-button"
          onClick={onDelete}
          title="Delete"
          type="button"
        >
          🗑
        </button>
        <img alt="Selected product image preview" src={image.previewUrl} />
      </div>
      <span className="seller-thumbnail-meta">
        {image.width ?? "?"}x{image.height ?? "?"} · {formatFileSize(image.file.size)}
      </span>
    </article>
  );
}
