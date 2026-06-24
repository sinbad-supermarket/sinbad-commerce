import Link from "next/link";
import type { CategoryRow } from "@/features/categories/types";

type CategoryTreeProps = {
  categories: CategoryRow[];
  query?: string;
};

function matchesSearch(category: CategoryRow, query: string) {
  const text = [
    category.name_en,
    category.name_ar,
    category.slug,
    category.description_en,
    category.description_ar,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(query);
}

function categoryRows(categories: CategoryRow[], query?: string) {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const childrenByParent = new Map<string, CategoryRow[]>();

  for (const category of categories) {
    if (!category.parent_id) {
      continue;
    }

    const existing = childrenByParent.get(category.parent_id) ?? [];
    existing.push(category);
    childrenByParent.set(category.parent_id, existing);
  }

  const rows: Array<{ category: CategoryRow; level: number; parentName: string }> = [];
  const parents = categories.filter((category) => !category.parent_id);

  for (const parent of parents) {
    const children = childrenByParent.get(parent.id) ?? [];
    const parentMatches = normalizedQuery
      ? matchesSearch(parent, normalizedQuery)
      : true;
    const matchingChildren = normalizedQuery
      ? children.filter((child) => matchesSearch(child, normalizedQuery))
      : children;

    if (parentMatches || matchingChildren.length > 0) {
      rows.push({ category: parent, level: 0, parentName: "None" });
    }

    for (const child of parentMatches && normalizedQuery ? children : matchingChildren) {
      rows.push({ category: child, level: 1, parentName: parent.name_en });
    }
  }

  return rows;
}

export function CategoryTree({ categories, query }: CategoryTreeProps) {
  const rows = categoryRows(categories, query);

  if (categories.length === 0) {
    return <p className="empty-state">No categories have been created yet.</p>;
  }

  if (rows.length === 0) {
    return <p className="empty-state">No categories match the current search.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Hierarchy</th>
            <th>Arabic name</th>
            <th>Slug</th>
            <th>Parent</th>
            <th>Sort</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, level, parentName }) => (
            <tr key={category.id}>
              <td>
                <span className={level === 0 ? "category-parent" : "category-child"}>
                  {level === 0 ? category.name_en : `- ${category.name_en}`}
                </span>
              </td>
              <td dir="rtl">{category.name_ar}</td>
              <td>{category.slug}</td>
              <td>{parentName}</td>
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
  );
}
