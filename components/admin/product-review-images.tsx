import type { StagedSubmissionImageListItem } from "@/features/vendor-submissions/types";

type ProductReviewImagesProps = {
  images: StagedSubmissionImageListItem[];
};

function formatFileSize(fileSize: number | null) {
  if (!fileSize) {
    return "Unknown";
  }

  return `${(fileSize / 1024).toFixed(1)} KB`;
}

export function ProductReviewImages({ images }: ProductReviewImagesProps) {
  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Staged images</h2>
      </div>

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
              <div className="image-details">
                <div className="image-meta">
                  <span className={image.is_primary ? "status-active" : "status-muted"}>
                    {image.is_primary ? "Primary" : "Secondary"}
                  </span>
                  <span>{image.mime_type}</span>
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>Sort: {image.sort_order}</span>
                </div>
                <p>English alt: {image.alt_text_en ?? "None"}</p>
                <p dir="rtl">Arabic alt: {image.alt_text_ar ?? "None"}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
