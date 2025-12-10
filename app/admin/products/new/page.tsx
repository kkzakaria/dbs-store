import { getCategories } from "@/actions/admin/products"
import { ProductFormWizard } from "@/components/admin/products/ProductFormWizard"

export const metadata = {
  title: "Nouveau produit | Administration DBS Store",
  description: "Créer un nouveau produit",
}

export default async function NewProductPage() {
  const result = await getCategories()

  if ("error" in result && result.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    )
  }

  const categories = result.categories || []

  return <ProductFormWizard categories={categories} />
}
