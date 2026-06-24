"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";
import { VendorImageUploadDropzone } from "./vendor-image-upload-dropzone";

type VendorSubmissionImagesProps = {
  canEdit: boolean;
  images: StagedSubmissionImageListItem[];
  submissionId: string;
};

function formatFileSize(fileSize: number | null) {
  if (!fileSize) {
    return "Unknown";
  }

  return `${(fileSize / 1024).toFixed(1)} KB`;
}

function sortedImages(images: StagedSubmissionImageListItem[]) {
  return [...images].sort((a, b) => a.sort_order - b.sort_order);
}

function imageAlt(image: StagedSubmissionImageListItem) {
  return image.alt_text_en ?? image.alt_text_ar ?? "Product image";
}

function uploadErrorFor(message: string) {
  if (message.includes("large") || message.includes("5 MB")) {
    return "Image is too large.";
  }

  if (message.includes("dimension") || message.includes("330x330")) {
    return "Image dimensions are invalid.";
  }

  if (message.includes("format") || message.includes("JPG") || message.includes("WebP")) {
    return "Unsupported image format.";
  }

  return message || "Upload failed. Please try again.";
}

export function VendorSubmissionImages({
  canEdit,
  images,
  submissionId,
}: VendorSubmissionImagesProps) {
  const [currentImages, setCurrentImages] = useState(images);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIds, setUploadingIds] = useState<string[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const orderedImages = useMemo(() => sortedImages(currentImages), [currentImages]);
  const primaryImage = orderedImages.find((image) => image.is_primary) ?? null;
  const additionalImages = orderedImages.filter((image) => !image.is_primary);
  const additionalImageIds = additionalImages.map((image) => image.id);

  async function uploadImage(file: File, imageRole: "primary" | "additional") {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempUrl = URL.createObjectURL(file);
    const tempImage: StagedSubmissionImageListItem = {
      id: tempId,
      storage_path: tempId,
      alt_text_en: null,
      alt_text_ar: null,
      sort_order: imageRole === "primary" ? 0 : currentImages.length + 1,
      is_primary: imageRole === "primary",
      file_size: file.size,
      mime_type: file.type,
      width: null,
      height: null,
      signedUrl: tempUrl,
    };
    const previousImages = currentImages;

    setError(null);
    setUploadingIds((ids) => [...ids, tempId]);
    setCurrentImages((items) =>
      imageRole === "primary"
        ? [...items.filter((image) => !image.is_primary), tempImage]
        : [...items, tempImage],
    );

    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("image_role", imageRole);

      const response = await fetch(
        `/vendor/products/submissions/${submissionId}/images`,
        {
          body: formData,
          method: "POST",
        },
      );
      const result = (await response.json()) as {
        error?: string;
        images?: StagedSubmissionImageListItem[];
      };

      if (!response.ok || !result.images) {
        throw new Error(result.error ?? "Upload failed. Please try again.");
      }

      setCurrentImages(result.images);
    } catch (uploadError) {
      setCurrentImages(previousImages);
      setError(
        uploadError instanceof Error
          ? uploadErrorFor(uploadError.message)
          : "Upload failed. Please try again.",
      );
    } finally {
      URL.revokeObjectURL(tempUrl);
      setUploadingIds((ids) => ids.filter((id) => id !== tempId));
    }
  }

  async function deleteImage(imageId: string) {
    const previousImages = currentImages;

    setError(null);
    setCurrentImages((items) => items.filter((image) => image.id !== imageId));

    try {
      const response = await fetch(
        `/vendor/products/submissions/${submissionId}/images/${imageId}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as {
        error?: string;
        images?: StagedSubmissionImageListItem[];
      };

      if (!response.ok || !result.images) {
        throw new Error(result.error ?? "Upload failed. Please try again.");
      }

      setCurrentImages(result.images);
    } catch (deleteError) {
      setCurrentImages(previousImages);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Upload failed. Please try again.",
      );
    }
  }

  async function reorderAdditionalImages(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || !canEdit) {
      return;
    }

    const oldIndex = additionalImageIds.indexOf(String(active.id));
    const newIndex = additionalImageIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousImages = currentImages;
    const reorderedAdditionalImages = arrayMove(additionalImages, oldIndex, newIndex).map(
      (image, index) => ({
        ...image,
        sort_order: index + 1,
      }),
    );
    const reorderedAdditionalById = new Map(
      reorderedAdditionalImages.map((image) => [image.id, image]),
    );
    const nextImages = currentImages.map((image) =>
      image.is_primary
        ? image
        : (reorderedAdditionalById.get(image.id) ?? image),
    );

    setError(null);
    setCurrentImages(nextImages);

    try {
      const response = await fetch(
        `/vendor/products/submissions/${submissionId}/images`,
        {
          body: JSON.stringify({
            imageIds: reorderedAdditionalImages.map((image) => image.id),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      );
      const result = (await response.json()) as {
        error?: string;
        images?: StagedSubmissionImageListItem[];
      };

      if (!response.ok || !result.images) {
        throw new Error(result.error ?? "Unable to reorder images.");
      }

      setCurrentImages(result.images);
    } catch (reorderError) {
      setCurrentImages(previousImages);
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : "Unable to reorder images.",
      );
    }
  }

  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Product Images</h2>
        <p className="field-help">
          Add 2-8 images. Use JPEG, PNG, or WebP up to 5 MB. Images must be
          between 330x330 and 5000x5000 pixels.
        </p>
      </div>

      <div className="image-count-row">
        <span className={currentImages.length >= 2 ? "status-active" : "status-muted"}>
          {currentImages.length}/8 images
        </span>
        <span className="field-help">Minimum 1 primary image and 1 additional image.</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="seller-image-section">
        <div>
          <h3>Primary Image</h3>
          <p className="field-help">This will be the main image of your product.</p>
        </div>
        <VendorImageUploadDropzone
          disabled={!canEdit}
          helperText="Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB. 330x330 to 5000x5000 pixels."
          imageRole="primary"
          onFileSelected={uploadImage}
          title={primaryImage ? "Replace primary image" : "Upload primary image"}
        >
          {primaryImage ? (
            <div className="seller-thumbnail-grid seller-thumbnail-grid-compact">
              <ImageThumbnail
                canEdit={canEdit}
                image={primaryImage}
                isUploading={uploadingIds.includes(primaryImage.id)}
                onDelete={deleteImage}
              />
            </div>
          ) : (
            <p className="empty-state">Please upload one primary image.</p>
          )}
        </VendorImageUploadDropzone>
      </section>

      <section className="seller-image-section">
        <div>
          <h3>Additional Images</h3>
          <p className="field-help">Add 1-7 images. You can drag and drop to reorder.</p>
        </div>
        <div className="image-count-row">
          <span className={additionalImages.length >= 1 ? "status-active" : "status-muted"}>
            {additionalImages.length} / 7 images
          </span>
        </div>
        <VendorImageUploadDropzone
          disabled={!canEdit || currentImages.length >= 8}
          helperText="Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB each. 330x330 to 5000x5000 pixels."
          imageRole="additional"
          onFileSelected={uploadImage}
          title="Upload additional images"
        >
          {additionalImages.length > 0 ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={reorderAdditionalImages}
              sensors={sensors}
            >
              <SortableContext items={additionalImageIds} strategy={rectSortingStrategy}>
                <div className="seller-thumbnail-grid">
                  {additionalImages.map((image) => (
                    <SortableImageThumbnail
                      canEdit={canEdit}
                      image={image}
                      isUploading={uploadingIds.includes(image.id)}
                      key={image.id}
                      onDelete={deleteImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="empty-state">Please upload at least one additional image.</p>
          )}
        </VendorImageUploadDropzone>
      </section>
    </section>
  );
}

function SortableImageThumbnail({
  canEdit,
  image,
  isUploading,
  onDelete,
}: {
  canEdit: boolean;
  image: StagedSubmissionImageListItem;
  isUploading: boolean;
  onDelete: (imageId: string) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled: !canEdit || isUploading,
    id: image.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={isDragging ? "seller-sortable-thumbnail is-dragging" : "seller-sortable-thumbnail"}
      ref={setNodeRef}
      style={style}
    >
      <ImageThumbnail
        canEdit={canEdit}
        dragAttributes={attributes}
        dragListeners={listeners}
        image={image}
        isUploading={isUploading}
        onDelete={onDelete}
      />
    </div>
  );
}

function ImageThumbnail({
  canEdit,
  dragAttributes,
  dragListeners,
  image,
  isUploading,
  onDelete,
}: {
  canEdit: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  image: StagedSubmissionImageListItem;
  isUploading: boolean;
  onDelete: (imageId: string) => void;
}) {
  return (
    <article
      className="seller-thumbnail-card"
      {...dragAttributes}
      {...dragListeners}
    >
      <div className="seller-thumbnail-preview">
        {image.is_primary ? (
          <span aria-label="Primary image" className="seller-primary-star">
            ★
          </span>
        ) : null}
        {canEdit && !isUploading ? (
          <button
            aria-label="Delete image"
            className="icon-button danger-icon-button seller-trash-button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(image.id);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            title="Delete"
            type="button"
          >
            🗑
          </button>
        ) : null}
        {isUploading ? <span className="seller-uploading-badge">Uploading...</span> : null}
        {image.signedUrl ? (
          <a href={image.signedUrl} rel="noreferrer" target="_blank">
            <img alt={imageAlt(image)} src={image.signedUrl} />
          </a>
        ) : (
          <span>Preview unavailable</span>
        )}
      </div>
      <span className="seller-thumbnail-meta">
        {image.width ?? "?"}x{image.height ?? "?"} · {formatFileSize(image.file_size)}
      </span>
    </article>
  );
}
