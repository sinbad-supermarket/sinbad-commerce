import Link from "next/link";
import { CategoryTree } from "@/components/admin/category-tree";
import { listAdminCategories } from "@/features/categories/queries";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [categories, { q }] = await Promise.all([
    listAdminCategories(),
    searchParams,
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Categories</h1>
          <p className="page-copy">Manage bilingual catalog categories.</p>
        </div>
        <Link className="primary-link" href="/admin/categories/new">
          New category
        </Link>
      </div>

      <form className="admin-form compact-form" action="/admin/categories">
        <label className="field">
          <span>Search categories</span>
          <input
            name="q"
            placeholder="Search by name or slug"
            defaultValue={q ?? ""}
          />
        </label>
        <button className="secondary-button" type="submit">
          Search
        </button>
      </form>

      <CategoryTree categories={categories} query={q} />
    </>
  );
}
