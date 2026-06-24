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

      {canEdit ? (
        <VendorImageUploadDropzone action={uploadAction} disabled={images.length >= 8} />
      ) : null}

      {orderedImages.length === 0 ? (
        <p className="empty-state">Upload at least 2 product images to submit for review.</p>
      ) : (
        <div className="image-card-grid">
          {orderedImages.map((image, index) => {
            const previousImage = orderedImages[index - 1];
            const nextImage = orderedImages[index + 1];

            return (
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
                  <span>Image {index + 1}</span>
                  <span>{image.width ?? "?"}x{image.height ?? "?"}</span>
                  <span>{formatFileSize(image.file_size)}</span>
                </div>
                <input name="alt_text_en" type="hidden" value={image.alt_text_en ?? ""} />
                <input name="alt_text_ar" type="hidden" value={image.alt_text_ar ?? ""} />

                {canEdit ? (
                  <div className="image-action-row">
                    {previousImage ? (
                      <button
                        className="secondary-button"
                        name="sort_order"
                        type="submit"
                        value={previousImage.sort_order - 1}
                      >
                        Move left
                      </button>
                    ) : null}
                    {nextImage ? (
                      <button
                        className="secondary-button"
                        name="sort_order"
                        type="submit"
                        value={nextImage.sort_order + 1}
                      >
                        Move right
                      </button>
                    ) : null}
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
            );
          })}
        </div>
      )}
    </section>
  );
}
