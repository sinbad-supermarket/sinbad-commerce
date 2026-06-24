import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { ProductImage } from "@/components/product/product-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { getPublicProductBySlug } from "@/features/public-catalog/queries";
import { richTextToPlainText } from "@/lib/utils/rich-text";

export const dynamic = "force-dynamic";

type ProductDetailParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailParams): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | Sinbad Commerce Lab",
    };
  }

  return {
    title: `${product.name_en} | Sinbad Commerce Lab`,
    description: product.short_description_en ?? richTextToPlainText(product.description_en) ?? product.name_en,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailParams) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const breadcrumbs = [
    { href: "/", label: "Home" },
    product.primaryCategory
      ? {
          href: `/categories/${product.primaryCategory.slug}`,
          label: product.primaryCategory.name_en,
        }
      : { href: "/products", label: "Products" },
    { label: product.name_en },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <article className="product-detail">
        <ProductImage image={product.primaryImage} />
        <div className="product-detail-body">
          <h1 className="page-title">{product.name_en}</h1>
          <p className="arabic-text" dir="rtl">
            {product.name_ar}
          </p>
          {product.price !== null && product.price !== undefined ? (
            <p className="price">{Number(product.price).toFixed(3)}</p>
          ) : null}
          {product.short_description_en ? (
            <p className="page-copy">{product.short_description_en}</p>
          ) : null}
          {product.short_description_ar ? (
            <p className="arabic-text" dir="rtl">
              {product.short_description_ar}
            </p>
          ) : null}
          <RichTextContent content={product.description_en} />
          <RichTextContent className="arabic-text" content={product.description_ar} dir="rtl" />
          {product.categories.length > 0 ? (
            <div className="chip-row">
              {product.categories.map((category) => (
                <a className="chip" href={`/categories/${category.slug}`} key={category.id}>
                  {category.name_en}
                </a>
              ))}
            </div>
          ) : null}
          <AddToCartForm productId={product.id} />
        </div>
      </article>
    </>
  );
}
