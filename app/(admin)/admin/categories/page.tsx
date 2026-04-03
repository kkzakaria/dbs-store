import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";
import { CategoryList } from "@/components/admin/category-list";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const db = await getDb();
  const categories = await getAllCategories(db);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catégories</h1>
      <CategoryList initialCategories={categories} />
    </div>
  );
}
