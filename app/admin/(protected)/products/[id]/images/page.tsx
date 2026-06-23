import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageList } from "@/components/admin/product-image-list";
import { ProductImageUploadForm } from "@/components/admin/product-image-upload-form";
import {
  deleteProductImage,
  makeProductImagePrimary,
  updateProductImage,
  uploadProductImage,
} from "@/features/product-images/actions";
import { listProductImages } from "@/features/product-images/queries";
import { getAdminProductById } from "@/features/products/queries";

export default async function ProductImagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const [product, images, { error }] = await Promise.all([
    getAdminProductById(id),
    listProductImages(id),
    searchParams,
  ]);

  if (!product) {
    notFound();
  }

  const uploadImage = uploadProductImage.bind(null, product.id);
  const updateImage = (imageId: string) =>
    updateProductImage.bind(null, product.id, imageId);
  const makePrimary = (imageId: string) =>
    makeProductImagePrimary.bind(null, product.id, imageId);
  const deleteImage = (imageId: string) =>
    deleteProductImage.bind(null, product.id, imageId);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Images</h1>
          <p className="page-copy">{product.name_en}</p>
        </div>
        <Link className="secondary-link" href="/admin/products">
          Back to products
        </Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="section-stack">
        <ProductImageUploadForm action={uploadImage} />
        <ProductImageList
          images={images}
          onDelete={deleteImage}
          onMakePrimary={makePrimary}
          onUpdate={updateImage}
        />
      </section>
    </>
  );
}
