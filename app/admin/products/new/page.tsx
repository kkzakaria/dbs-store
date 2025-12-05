import { getCategories } from "@/actions/admin/products"
import { ProductForm } from "@/components/admin/products/ProductForm"

export const metadata = {
  title: "Nouveau produit | Administration DBS Store",
  description: "Creer un nouveau produit",
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

  return <ProductForm categories={categories} />
}
