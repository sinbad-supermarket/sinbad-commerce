import Link from "next/link";
import type { PublicProduct } from "@/features/public-catalog/types";
import { ProductImage } from "./product-image";

type ProductCardProps = {
  product: PublicProduct;
};

function formatPrice(price: string | number | null) {
  if (price === null || price === undefined) {
    return null;
  }

  return Number(price).toFixed(3);
}

export function ProductCard({ product }: ProductCardProps) {
  const price = formatPrice(product.price);

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} aria-label={product.name_en}>
        <ProductImage image={product.primaryImage} />
      </Link>
      <div className="product-card-body">
        <Link href={`/products/${product.slug}`}>
          <h2>{product.name_en}</h2>
        </Link>
        <p className="arabic-text" dir="rtl">
          {product.name_ar}
        </p>
        {product.primaryCategory ? (
          <Link className="muted-link" href={`/categories/${product.primaryCategory.slug}`}>
            {product.primaryCategory.name_en}
          </Link>
        ) : null}
        {price ? <p className="price">{price}</p> : null}
      </div>
    </article>
  );
}
