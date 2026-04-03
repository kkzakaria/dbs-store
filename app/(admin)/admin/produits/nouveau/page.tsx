import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/actions/admin-products";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage() {
  const db = await getDb();
  const categories = await getAllCategories(db);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Nouveau produit</h1>
      <ProductForm
        action={createProduct}
        submitLabel="Créer le produit"
        categories={categories}
      />
    </div>
  );
}
