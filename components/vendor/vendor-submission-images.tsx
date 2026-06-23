import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";

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

export function VendorSubmissionImages({
  canEdit,
  images,
  onDelete,
  onMakePrimary,
  onUpdate,
  uploadAction,
}: VendorSubmissionImagesProps) {
  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Staged images</h2>
        <p className="field-help">
          Images remain private and publish only after admin approval.
        </p>
      </div>

      {canEdit ? (
        <form className="admin-form" action={uploadAction}>
          <label className="field">
            <span>Image</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              name="image"
              required
              type="file"
            />
          </label>
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
            <input name="sort_order" defaultValue="0" required />
          </label>
          <button className="primary-button" type="submit">
            Upload staged image
          </button>
        </form>
      ) : null}

      {images.length === 0 ? (
        <p className="empty-state">No staged images are attached to this submission.</p>
      ) : (
        <div className="image-list">
          {images.map((image) => (
            <article className="image-item" key={image.id}>
              <div className="image-preview">
                {image.signedUrl ? (
                  <a
                    className="image-preview-link"
                    href={image.signedUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={image.alt_text_en ?? image.alt_text_ar ?? "Staged product image"}
                      className="image-preview-thumb"
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
                  <span>{image.mime_type}</span>
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
                      Save image
                    </button>
                    {!image.is_primary ? (
                      <button
                        className="secondary-button"
                        formAction={onMakePrimary(image.id)}
                        type="submit"
                      >
                        Make primary
                      </button>
                    ) : null}
                    <button
                      className="danger-button"
                      formAction={onDelete(image.id)}
                      type="submit"
                    >
                      Delete image
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
