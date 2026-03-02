import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/actions/admin-products";

export default function NouveauProduitPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Nouveau produit</h1>
      <ProductForm action={createProduct} submitLabel="Créer le produit" />
    </div>
  );
}
