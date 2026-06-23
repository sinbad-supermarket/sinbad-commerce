import Link from "next/link";
import type { PublicCategory } from "@/features/public-catalog/types";

type CategoryListProps = {
  categories: PublicCategory[];
};

export function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return <p className="empty-state">No active categories are available yet.</p>;
  }

  return (
    <div className="category-grid">
      {categories.map((category) => (
        <Link className="category-tile" href={`/categories/${category.slug}`} key={category.id}>
          <span>{category.name_en}</span>
          <small dir="rtl">{category.name_ar}</small>
        </Link>
      ))}
    </div>
  );
}
