import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";
import { VendorImageUploadDropzone } from "./vendor-image-upload-dropzone";

type VendorSubmissionImagesProps = {
  canEdit: boolean;
  images: StagedSubmissionImageListItem[];
  onDelete: (imageId: string) => () => void | Promise<void>;
  onMakePrimary: (imageId: string) => () => void | Promise<void>;
  onUpdate: (imageId: string) => (formData: FormData) => void | Promise<void>;
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
  onMakePrimary,
  onUpdate,
  uploadAction,
}: VendorSubmissionImagesProps) {
  const orderedImages = sortedImages(images);

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
        <span className="field-help">First image in the list is shown first after approval.</span>
      </div>

      <VendorImageUploadDropzone action={uploadAction} disabled={!canEdit || images.length >= 8}>
        {orderedImages.length === 0 ? (
          <p className="empty-state">Upload at least 2 product images to submit for review.</p>
        ) : (
          <div className="seller-thumbnail-grid">
            {orderedImages.map((image, index) => {
              const previousImage = orderedImages[index - 1];
              const nextImage = orderedImages[index + 1];

              return (
                <article className="seller-thumbnail-card" key={image.id}>
                  <div className="seller-thumbnail-preview">
                    {image.is_primary ? (
                      <span aria-label="Primary image" className="seller-primary-star">
                        ★
                      </span>
                    ) : null}
                    {image.signedUrl ? (
                      <a href={image.signedUrl} rel="noreferrer" target="_blank">
                        <img alt={imageAlt(image)} src={image.signedUrl} />
                      </a>
                    ) : (
                      <span>Preview unavailable</span>
                    )}
                  </div>

                  <form className="seller-thumbnail-actions" action={onUpdate(image.id)}>
                    <input name="alt_text_en" type="hidden" value={image.alt_text_en ?? ""} />
                    <input name="alt_text_ar" type="hidden" value={image.alt_text_ar ?? ""} />
                    <span className="seller-thumbnail-meta">
                      {image.width ?? "?"}x{image.height ?? "?"} · {formatFileSize(image.file_size)}
                    </span>

                    {canEdit ? (
                      <div className="seller-icon-row">
                        {previousImage ? (
                          <button
                            aria-label="Move image left"
                            className="icon-button"
                            name="sort_order"
                            title="Move left"
                            type="submit"
                            value={previousImage.sort_order - 1}
                          >
                            ←
                          </button>
                        ) : null}
                        {nextImage ? (
                          <button
                            aria-label="Move image right"
                            className="icon-button"
                            name="sort_order"
                            title="Move right"
                            type="submit"
                            value={nextImage.sort_order + 1}
                          >
                            →
                          </button>
                        ) : null}
                        <button
                          aria-label={image.is_primary ? "Primary image" : "Set as primary image"}
                          className={`icon-button${image.is_primary ? " is-active" : ""}`}
                          disabled={image.is_primary}
                          formAction={image.is_primary ? undefined : onMakePrimary(image.id)}
                          title={image.is_primary ? "Primary image" : "Set primary"}
                          type="submit"
                        >
                          ★
                        </button>
                        <button
                          aria-label="Delete image"
                          className="icon-button danger-icon-button"
                          formAction={onDelete(image.id)}
                          title="Delete"
                          type="submit"
                        >
                          🗑
                        </button>
                      </div>
                    ) : null}
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </VendorImageUploadDropzone>
    </section>
  );
}
