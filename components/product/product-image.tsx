import type { PublicImage } from "@/features/public-catalog/types";

type ProductImageProps = {
  image: PublicImage | null;
};

export function ProductImage({ image }: ProductImageProps) {
  if (!image?.signedUrl) {
    return <div className="product-image-placeholder">No image</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="product-image"
      src={image.signedUrl}
      alt={image.alt_text_en ?? image.alt_text_ar ?? ""}
    />
  );
}
