import { notFound } from "next/navigation"
import { getAdminProduct, getCategories } from "@/actions/admin/products"
import { ProductForm } from "@/components/admin/products/ProductForm"

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: "Modifier le produit | Administration DBS Store",
  description: "Modifier un produit existant",
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  const [productResult, categoriesResult] = await Promise.all([
    getAdminProduct({ id }),
    getCategories(),
  ])

  if ("error" in productResult && productResult.error) {
    notFound()
  }

  if ("error" in categoriesResult && categoriesResult.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{categoriesResult.error}</p>
      </div>
    )
  }

  const product = productResult.data?.product
  const categories = categoriesResult.categories || []

  if (!product) {
    notFound()
  }

  return <ProductForm product={product} categories={categories} />
}
