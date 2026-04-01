import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getAdminProductById } from "@/lib/data/admin-products";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/lib/actions/admin-products";

type Props = { params: Promise<{ id: string }> };

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const product = await getAdminProductById(db, id);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Éditer : {product.name}</h1>
      <ProductForm initial={product} action={action} submitLabel="Enregistrer" />
    </div>
  );
}
