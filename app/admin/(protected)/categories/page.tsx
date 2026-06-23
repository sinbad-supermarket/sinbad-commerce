import Link from "next/link";
import { listAdminCategories } from "@/features/categories/queries";

function parentName(categoryId: string | null, categories: Awaited<ReturnType<typeof listAdminCategories>>) {
  if (!categoryId) {
    return "None";
  }

  return categories.find((category) => category.id === categoryId)?.name_en ?? "Unknown";
}

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

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

      {categories.length === 0 ? (
        <p className="empty-state">No categories have been created yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>English name</th>
                <th>Arabic name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name_en}</td>
                  <td dir="rtl">{category.name_ar}</td>
                  <td>{category.slug}</td>
                  <td>{parentName(category.parent_id, categories)}</td>
                  <td>{category.sort_order}</td>
                  <td>
                    <span className={category.is_active ? "status-active" : "status-muted"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
