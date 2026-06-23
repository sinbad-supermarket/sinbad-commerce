import type { ProductImageListItem } from "@/features/product-images/types";

type ProductImageListProps = {
  images: ProductImageListItem[];
  onDelete: (imageId: string) => () => void | Promise<void>;
  onMakePrimary: (imageId: string) => () => void | Promise<void>;
  onUpdate: (imageId: string) => (formData: FormData) => void | Promise<void>;
};

function formatFileSize(fileSize: number | null) {
  if (!fileSize) {
    return "Unknown";
  }

  return `${(fileSize / 1024).toFixed(1)} KB`;
}

export function ProductImageList({
  images,
  onDelete,
  onMakePrimary,
  onUpdate,
}: ProductImageListProps) {
  if (images.length === 0) {
    return <p className="empty-state">No images have been uploaded for this product.</p>;
  }

  return (
    <div className="image-list">
      {images.map((image) => (
        <article className="image-item" key={image.id}>
          <div className="image-preview">
            {image.signedUrl ? (
              <a
                className="image-preview-link"
                href={image.signedUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={image.signedUrl}
                  alt={image.alt_text_en ?? image.alt_text_ar ?? "Product image"}
                  className="image-preview-thumb"
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
              <span>{image.mime_type ?? "Unknown type"}</span>
              <span>{formatFileSize(image.file_size)}</span>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>English alt text</span>
                <input name="alt_text_en" defaultValue={image.alt_text_en ?? ""} />
              </label>
              <label className="field">
                <span>Arabic alt text</span>
                <input
                  name="alt_text_ar"
                  defaultValue={image.alt_text_ar ?? ""}
                  dir="rtl"
                />
              </label>
            </div>

            <label className="field">
              <span>Sort order</span>
              <input
                name="sort_order"
                type="number"
                defaultValue={image.sort_order}
                required
              />
            </label>

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
          </form>
        </article>
      ))}
    </div>
  );
}
