import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getAdminProductById } from "@/lib/data/admin-products";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/lib/actions/admin-products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const [product, categories] = await Promise.all([
    getAdminProductById(db, id),
    getAllCategories(db),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Éditer : {product.name}</h1>
      <ProductForm
        initial={product}
        action={action}
        submitLabel="Enregistrer"
        categories={categories}
      />
    </div>
  );
}
