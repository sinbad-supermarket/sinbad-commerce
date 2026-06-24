import Link from "next/link";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { formatCartMoney } from "@/components/cart/cart-summary";
import {
  cancelDraftSubmission,
  createUpdateSubmissionFromProduct,
  duplicateProductAsDraft,
} from "@/features/vendor-submissions/actions";
import {
  listActiveCategoryOptions,
  listVendorCanonicalProducts,
  listVendorProductCategoryAssignments,
  listVendorSubmissions,
} from "@/features/vendor-submissions/queries";
import { createStagedSubmissionImageSignedItems } from "@/features/vendor-submissions/images";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";
import type {
  ProductReviewSubmissionRow,
  VendorCanonicalProductListItem,
} from "@/features/vendor-submissions/types";

type VendorProductsPageProps = {
  searchParams?: Promise<{
    error?: string;
    q?: string;
    category?: string;
    brand?: string;
    status?: string;
    stock?: string;
    updated?: string;
    sort?: string;
  }>;
};

type DashboardStatus =
  | "approved"
  | "pending_review"
  | "draft"
  | "rejected"
  | "changes_requested"
  | "hidden"
  | "out_of_stock";

type ProductDashboardRow = {
  id: string;
  kind: "product" | "submission";
  productId: string | null;
  submissionId: string | null;
  nameEn: string;
  nameAr: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string;
  brand: string | null;
  price: string | number | null;
  stockQuantity: number | null;
  availability: string | null;
  status: DashboardStatus;
  updatedAt: string;
  slug: string | null;
  adminNotes: string | null;
  changeType: string | null;
  imageUrl: string | null;
  canEdit: boolean;
  canDeleteDraft: boolean;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function statusLabel(status: DashboardStatus) {
  const labels: Record<DashboardStatus, string> = {
    approved: "Approved",
    pending_review: "Pending Review",
    draft: "Draft",
    rejected: "Rejected",
    changes_requested: "Changes Requested",
    hidden: "Hidden",
    out_of_stock: "Out Of Stock",
  };

  return labels[status];
}

function statusClassName(status: DashboardStatus) {
  if (status === "approved") {
    return "status-active";
  }

  if (status === "pending_review" || status === "changes_requested") {
    return "status-warning";
  }

  if (status === "rejected") {
    return "status-danger";
  }

  return "status-muted";
}

function canonicalStatus(product: VendorCanonicalProductListItem): DashboardStatus {
  if (product.availability === "out_of_stock" || product.stock_quantity === 0) {
    return "out_of_stock";
  }

  if (product.review_status === "pending_review") {
    return "pending_review";
  }

  if (product.review_status === "rejected") {
    return "rejected";
  }

  if (product.review_status === "changes_requested") {
    return "changes_requested";
  }

  if (product.status === "active" && product.review_status === "approved") {
    return "approved";
  }

  return "hidden";
}

function submissionStatus(submission: ProductReviewSubmissionRow): DashboardStatus {
  if (submission.status === "submitted") {
    return "pending_review";
  }

  if (submission.status === "changes_requested") {
    return "changes_requested";
  }

  if (submission.status === "rejected") {
    return "rejected";
  }

  return "draft";
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesUpdatedFilter(updatedAt: string, filter: string | undefined) {
  if (!filter) {
    return true;
  }

  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (filter === "7d") {
    return now - updated <= 7 * day;
  }

  if (filter === "30d") {
    return now - updated <= 30 * day;
  }

  return true;
}

function sortRows(rows: ProductDashboardRow[], sort: string | undefined) {
  return [...rows].sort((a, b) => {
    const left = new Date(a.updatedAt).getTime();
    const right = new Date(b.updatedAt).getTime();

    if (sort === "oldest") {
      return left - right;
    }

    return right - left;
  });
}

async function signedPrimaryImage(submission: ProductReviewSubmissionRow | undefined) {
  const primary = submission?.snapshot.images.find((image) => image.is_primary);

  if (!primary) {
    return null;
  }

  const [signed] = await createStagedSubmissionImageSignedItems([primary]);
  return signed?.signedUrl ?? null;
}

export default async function VendorProductsPage({
  searchParams,
}: VendorProductsPageProps) {
  const { currentVendor, memberships } = await requireSelectedVendor();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [products, submissions, categories] = await Promise.all([
    listVendorCanonicalProducts(currentVendor.vendor.id),
    listVendorSubmissions(currentVendor.vendor.id),
    listActiveCategoryOptions(),
  ]);
  const { error } = resolvedSearchParams;
  const canWrite = currentVendor.vendor.status !== "suspended";
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoryAssignments = new Map<string, string | null>();

  await Promise.all(
    products.map(async (product) => {
      const assignments = await listVendorProductCategoryAssignments(
        product.id,
        currentVendor.vendor.id,
      );
      const primary = assignments.find((assignment) => assignment.is_primary) ?? assignments[0];
      categoryAssignments.set(product.id, primary?.category_id ?? null);
    }),
  );

  const submissionsByProduct = new Map<string, ProductReviewSubmissionRow[]>();
  submissions.forEach((submission) => {
    if (!submission.product_id) {
      return;
    }

    const productSubmissions = submissionsByProduct.get(submission.product_id) ?? [];
    productSubmissions.push(submission);
    submissionsByProduct.set(submission.product_id, productSubmissions);
  });

  const rows: ProductDashboardRow[] = [];

  for (const product of products) {
    const productSubmissions = submissionsByProduct.get(product.id) ?? [];
    const activeSubmission = productSubmissions.find((submission) =>
      ["submitted", "changes_requested", "rejected", "draft"].includes(submission.status),
    );
    const approvedSubmission = productSubmissions.find(
      (submission) => submission.status === "approved",
    );
    const imageUrl = await signedPrimaryImage(activeSubmission ?? approvedSubmission);
    const categoryId = categoryAssignments.get(product.id) ?? null;
    const status = activeSubmission ? submissionStatus(activeSubmission) : canonicalStatus(product);

    rows.push({
      id: product.id,
      kind: "product",
      productId: product.id,
      submissionId: activeSubmission?.id ?? null,
      nameEn: activeSubmission?.snapshot.product.name_en || product.name_en,
      nameAr: activeSubmission?.snapshot.product.name_ar || product.name_ar,
      sku: activeSubmission?.snapshot.product.sku ?? product.sku,
      barcode: activeSubmission?.snapshot.product.barcode ?? product.barcode,
      categoryId,
      categoryName: categoryId ? categoryById.get(categoryId)?.name_en ?? "Category" : "None",
      brand: activeSubmission?.snapshot.product.brand_name ?? product.brand_name,
      price: activeSubmission?.snapshot.product.price ?? product.price,
      stockQuantity: activeSubmission?.snapshot.product.stock_quantity ?? product.stock_quantity,
      availability: activeSubmission?.snapshot.product.availability ?? product.availability,
      status,
      updatedAt: activeSubmission?.updated_at ?? product.updated_at,
      slug: product.slug,
      adminNotes: activeSubmission?.admin_notes ?? null,
      changeType: activeSubmission?.change_type ?? null,
      imageUrl,
      canEdit: canWrite && ["approved", "hidden", "draft", "rejected", "changes_requested"].includes(status),
      canDeleteDraft: canWrite && activeSubmission?.status === "draft",
    });
  }

  for (const submission of submissions) {
    if (submission.product_id || submission.status === "cancelled" || submission.status === "approved") {
      continue;
    }

    const primaryCategory = submission.snapshot.categories.find((category) => category.is_primary)
      ?? submission.snapshot.categories[0];
    const categoryId = primaryCategory?.category_id ?? null;
    const imageUrl = await signedPrimaryImage(submission);

    rows.push({
      id: submission.id,
      kind: "submission",
      productId: null,
      submissionId: submission.id,
      nameEn: submission.snapshot.product.name_en || "Untitled product",
      nameAr: submission.snapshot.product.name_ar || "",
      sku: submission.snapshot.product.sku,
      barcode: submission.snapshot.product.barcode,
      categoryId,
      categoryName: categoryId ? categoryById.get(categoryId)?.name_en ?? "Category" : "None",
      brand: submission.snapshot.product.brand_name,
      price: submission.snapshot.product.price,
      stockQuantity: submission.snapshot.product.stock_quantity,
      availability: submission.snapshot.product.availability,
      status: submissionStatus(submission),
      updatedAt: submission.updated_at,
      slug: null,
      adminNotes: submission.admin_notes,
      changeType: submission.change_type,
      imageUrl,
      canEdit: canWrite && ["draft", "rejected", "changes_requested"].includes(submission.status),
      canDeleteDraft: canWrite && submission.status === "draft",
    });
  }

  const summaryRows = rows.filter((row) => row.status !== "hidden" || row.kind === "product");
  const q = normalizeText(resolvedSearchParams.q);
  const filteredRows = sortRows(
    rows.filter((row) => {
      const searchMatches = !q
        || normalizeText(row.nameEn).includes(q)
        || normalizeText(row.nameAr).includes(q)
        || normalizeText(row.sku).includes(q)
        || normalizeText(row.barcode).includes(q);
      const categoryMatches = !resolvedSearchParams.category || row.categoryId === resolvedSearchParams.category;
      const brandMatches = !resolvedSearchParams.brand || normalizeText(row.brand) === normalizeText(resolvedSearchParams.brand);
      const statusMatches = !resolvedSearchParams.status || row.status === resolvedSearchParams.status;
      const stockMatches =
        !resolvedSearchParams.stock
        || (resolvedSearchParams.stock === "out_of_stock"
          ? row.status === "out_of_stock"
          : row.status !== "out_of_stock");

      return (
        searchMatches
        && categoryMatches
        && brandMatches
        && statusMatches
        && stockMatches
        && matchesUpdatedFilter(row.updatedAt, resolvedSearchParams.updated)
      );
    }),
    resolvedSearchParams.sort,
  );
  const brandOptions = Array.from(
    new Set(rows.map((row) => row.brand).filter((brand): brand is string => Boolean(brand))),
  ).sort((a, b) => a.localeCompare(b));
  const counts = {
    all: summaryRows.length,
    approved: summaryRows.filter((row) => row.status === "approved").length,
    pending: summaryRows.filter((row) => row.status === "pending_review").length,
    draft: summaryRows.filter((row) => row.status === "draft").length,
    rejected: summaryRows.filter((row) => row.status === "rejected" || row.status === "changes_requested").length,
    hidden: summaryRows.filter((row) => row.status === "hidden").length,
    outOfStock: summaryRows.filter((row) => row.status === "out_of_stock").length,
  };

  return (
    <VendorShell currentVendor={currentVendor} memberships={memberships}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-copy">
            Manage your listings, review status, stock, and product updates.
          </p>
        </div>
        {canWrite ? (
          <Link className="primary-link vendor-add-product-link" href="/vendor/products/new">
            Add Product
          </Link>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="vendor-product-summary" aria-label="Product summary">
        <div className="dashboard-card">
          <span>All Products</span>
          <strong>{counts.all}</strong>
        </div>
        <div className="dashboard-card">
          <span>Approved</span>
          <strong>{counts.approved}</strong>
        </div>
        <div className="dashboard-card">
          <span>Pending Review</span>
          <strong>{counts.pending}</strong>
        </div>
        <div className="dashboard-card">
          <span>Draft</span>
          <strong>{counts.draft}</strong>
        </div>
        <div className="dashboard-card">
          <span>Rejected</span>
          <strong>{counts.rejected}</strong>
        </div>
        <div className="dashboard-card">
          <span>Hidden</span>
          <strong>{counts.hidden}</strong>
        </div>
        <div className="dashboard-card">
          <span>Out Of Stock</span>
          <strong>{counts.outOfStock}</strong>
        </div>
      </section>

      <form className="vendor-product-filters">
        <label>
          Search
          <input
            defaultValue={resolvedSearchParams.q ?? ""}
            name="q"
            placeholder="Product name, SKU, or barcode"
            type="search"
          />
        </label>
        <label>
          Category
          <select defaultValue={resolvedSearchParams.category ?? ""} name="category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parent_id ? "-- " : ""}{category.name_en}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select defaultValue={resolvedSearchParams.brand ?? ""} name="brand">
            <option value="">All brands</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select defaultValue={resolvedSearchParams.status ?? ""} name="status">
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="hidden">Hidden</option>
            <option value="out_of_stock">Out Of Stock</option>
          </select>
        </label>
        <label>
          Stock
          <select defaultValue={resolvedSearchParams.stock ?? ""} name="stock">
            <option value="">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </label>
        <label>
          Updated
          <select defaultValue={resolvedSearchParams.updated ?? ""} name="updated">
            <option value="">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
        <label>
          Sort
          <select defaultValue={resolvedSearchParams.sort ?? "newest"} name="sort">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </label>
        <div className="vendor-product-filter-actions">
          <button className="primary-button" type="submit">Apply</button>
          <Link className="secondary-link" href="/vendor/products">Reset</Link>
        </div>
      </form>

      {filteredRows.length === 0 ? (
        <p className="empty-state">No products match the current filters.</p>
      ) : (
        <div className="table-wrap vendor-product-table-wrap">
          <table className="admin-table vendor-product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const editHref = row.submissionId
                  ? `/vendor/products/submissions/${row.submissionId}`
                  : null;
                const createUpdateSubmission = row.productId
                  ? createUpdateSubmissionFromProduct.bind(null, row.productId)
                  : null;
                const duplicateProduct = row.productId
                  ? duplicateProductAsDraft.bind(null, row.productId)
                  : null;
                const deleteDraft = row.submissionId
                  ? cancelDraftSubmission.bind(null, row.submissionId)
                  : null;

                return (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <div className="vendor-product-cell">
                        <div className="vendor-product-thumb" aria-hidden="true">
                          {row.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.imageUrl} alt="" />
                          ) : (
                            <span>{row.nameEn.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <strong>{row.nameEn}</strong>
                          {row.nameAr ? (
                            <span className="arabic-text vendor-product-arabic" dir="rtl">
                              {row.nameAr}
                            </span>
                          ) : null}
                          <span className="field-help">
                            {row.sku ? `SKU: ${row.sku}` : "SKU: Not set"}
                            {row.barcode ? ` · Barcode: ${row.barcode}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{row.categoryName}</td>
                    <td>{row.brand ?? "None"}</td>
                    <td>{row.price ? formatCartMoney(row.price) : "Not set"}</td>
                    <td>
                      {row.stockQuantity ?? "Not set"}
                      {row.availability ? <span className="field-help">{row.availability.replaceAll("_", " ")}</span> : null}
                    </td>
                    <td>
                      <span className={statusClassName(row.status)}>
                        {statusLabel(row.status)}
                      </span>
                      {row.adminNotes ? (
                        <span className="vendor-rejection-note">{row.adminNotes}</span>
                      ) : null}
                    </td>
                    <td>{formatDate(row.updatedAt)}</td>
                    <td>
                      <div className="vendor-product-actions">
                        {row.status === "approved" && createUpdateSubmission ? (
                          <form action={createUpdateSubmission}>
                            <button className="secondary-button" type="submit">Edit</button>
                          </form>
                        ) : null}
                        {row.status === "approved" && row.slug ? (
                          <Link className="secondary-link" href={`/products/${row.slug}`}>
                            Preview
                          </Link>
                        ) : null}
                        {row.status === "approved" && duplicateProduct ? (
                          <form action={duplicateProduct}>
                            <button className="secondary-button" type="submit">Duplicate</button>
                          </form>
                        ) : null}
                        {row.status === "draft" && editHref ? (
                          <Link className="secondary-link" href={editHref}>Edit</Link>
                        ) : null}
                        {row.canDeleteDraft && deleteDraft ? (
                          <form action={deleteDraft}>
                            <button className="danger-button" type="submit">Delete</button>
                          </form>
                        ) : null}
                        {row.status === "pending_review" && editHref ? (
                          <Link className="secondary-link" href={editHref}>View Submission</Link>
                        ) : null}
                        {row.status === "rejected" && editHref ? (
                          <Link className="secondary-link" href={editHref}>Edit &amp; Resubmit</Link>
                        ) : null}
                        {row.status === "changes_requested" && editHref ? (
                          <Link className="secondary-link" href={editHref}>Edit Changes</Link>
                        ) : null}
                        {row.status === "hidden" && createUpdateSubmission ? (
                          <form action={createUpdateSubmission}>
                            <button className="secondary-button" type="submit">Edit</button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VendorShell>
  );
}
