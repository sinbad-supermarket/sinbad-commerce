import type { ProductReviewDetail } from "@/features/product-reviews/types";

type ProductReviewComparisonProps = {
  review: ProductReviewDetail;
};

type ComparisonRow = {
  label: string;
  canonical: string;
  submitted: string;
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  return String(value);
}

function priceValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  return String(value);
}

export function ProductReviewComparison({ review }: ProductReviewComparisonProps) {
  const submitted = review.snapshot.product;
  const canonical = review.canonicalProduct;
  const rows: ComparisonRow[] = [
    {
      label: "Slug",
      canonical: displayValue(canonical?.slug),
      submitted: displayValue(submitted.slug),
    },
    {
      label: "SKU",
      canonical: displayValue(canonical?.sku),
      submitted: displayValue(submitted.sku),
    },
    {
      label: "Barcode",
      canonical: displayValue(canonical?.barcode),
      submitted: displayValue(submitted.barcode),
    },
    {
      label: "English name",
      canonical: displayValue(canonical?.name_en),
      submitted: displayValue(submitted.name_en),
    },
    {
      label: "Arabic name",
      canonical: displayValue(canonical?.name_ar),
      submitted: displayValue(submitted.name_ar),
    },
    {
      label: "English short description",
      canonical: displayValue(canonical?.short_description_en),
      submitted: displayValue(submitted.short_description_en),
    },
    {
      label: "Arabic short description",
      canonical: displayValue(canonical?.short_description_ar),
      submitted: displayValue(submitted.short_description_ar),
    },
    {
      label: "English description",
      canonical: displayValue(canonical?.description_en),
      submitted: displayValue(submitted.description_en),
    },
    {
      label: "Arabic description",
      canonical: displayValue(canonical?.description_ar),
      submitted: displayValue(submitted.description_ar),
    },
    {
      label: "Price",
      canonical: priceValue(canonical?.price),
      submitted: priceValue(submitted.price),
    },
    {
      label: "Sale price",
      canonical: priceValue(canonical?.sale_price),
      submitted: priceValue(submitted.sale_price),
    },
    {
      label: "Brand",
      canonical: displayValue(canonical?.brand_name),
      submitted: displayValue(submitted.brand_name),
    },
    {
      label: "Video URL",
      canonical: displayValue(canonical?.video_url),
      submitted: displayValue(submitted.video_url),
    },
    {
      label: "Stock quantity",
      canonical: displayValue(canonical?.stock_quantity),
      submitted: displayValue(submitted.stock_quantity),
    },
    {
      label: "Availability",
      canonical: displayValue(canonical?.availability),
      submitted: displayValue(submitted.availability),
    },
    {
      label: "Warranty",
      canonical: displayValue(canonical?.warranty),
      submitted: displayValue(submitted.warranty),
    },
    {
      label: "Status",
      canonical: displayValue(canonical?.status),
      submitted: displayValue(submitted.intended_status),
    },
  ];

  return (
    <section className="section-stack">
      <div>
        <h2 className="section-title">Product fields</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Canonical</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.canonical}</td>
                  <td>{row.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="section-title">Specifications</h2>
        {submitted.specifications.length === 0 ? (
          <p className="empty-state">No specifications are included in this snapshot.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {submitted.specifications.map((specification) => (
                  <tr key={specification.key}>
                    <td>{specification.key}</td>
                    <td>{specification.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title">Categories</h2>
        {review.snapshot.categories.length === 0 ? (
          <p className="empty-state">No categories are included in this snapshot.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category ID</th>
                  <th>Primary</th>
                </tr>
              </thead>
              <tbody>
                {review.snapshot.categories.map((category) => (
                  <tr key={category.category_id}>
                    <td>{category.category_id}</td>
                    <td>{category.is_primary ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
