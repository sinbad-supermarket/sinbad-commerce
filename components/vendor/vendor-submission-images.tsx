import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";
import { VendorImageUploadDropzone } from "./vendor-image-upload-dropzone";

type VendorSubmissionImagesProps = {
  canEdit: boolean;
  images: StagedSubmissionImageListItem[];
  onDelete: (imageId: string) => () => void | Promise<void>;
  uploadAction: (formData: FormData) => void | Promise<void>;
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

export function VendorSubmissionImages({
  canEdit,
  images,
  onDelete,
  uploadAction,
}: VendorSubmissionImagesProps) {
  const orderedImages = sortedImages(images);
  const primaryImage = orderedImages.find((image) => image.is_primary) ?? null;
  const additionalImages = orderedImages.filter((image) => !image.is_primary);

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
        <span className={images.length >= 2 ? "status-active" : "status-muted"}>
          {images.length}/8 images
        </span>
        <span className="field-help">Minimum 1 primary image and 1 additional image.</span>
      </div>

      <section className="seller-image-section">
        <div>
          <h3>Primary Image</h3>
          <p className="field-help">This will be the main image of your product.</p>
        </div>
        <VendorImageUploadDropzone
          action={uploadAction}
          disabled={!canEdit}
          helperText="Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB. 330x330 to 5000x5000 pixels."
          imageRole="primary"
          title={primaryImage ? "Replace primary image" : "Upload primary image"}
        >
          {primaryImage ? (
            <div className="seller-thumbnail-grid seller-thumbnail-grid-compact">
              <ImageThumbnail canEdit={canEdit} image={primaryImage} onDelete={onDelete} />
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
          action={uploadAction}
          disabled={!canEdit || images.length >= 8}
          helperText="Drag and drop or click to browse. JPG, JPEG, PNG, WebP. Max 5 MB each. 330x330 to 5000x5000 pixels."
          imageRole="additional"
          title="Upload additional images"
        >
          {additionalImages.length > 0 ? (
            <div className="seller-thumbnail-grid">
              {additionalImages.map((image) => (
                <ImageThumbnail
                  canEdit={canEdit}
                  image={image}
                  key={image.id}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">Please upload at least one additional image.</p>
          )}
        </VendorImageUploadDropzone>
      </section>
    </section>
  );
}

function ImageThumbnail({
  canEdit,
  image,
  onDelete,
}: {
  canEdit: boolean;
  image: StagedSubmissionImageListItem;
  onDelete: (imageId: string) => () => void | Promise<void>;
}) {
  return (
    <article className="seller-thumbnail-card">
      <div className="seller-thumbnail-preview">
        {image.is_primary ? (
          <span aria-label="Primary image" className="seller-primary-star">
            ★
          </span>
        ) : null}
        {canEdit ? (
          <form action={onDelete(image.id)} className="seller-delete-form">
            <button
              aria-label="Delete image"
              className="icon-button danger-icon-button seller-trash-button"
              title="Delete"
              type="submit"
            >
              🗑
            </button>
          </form>
        ) : null}
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
