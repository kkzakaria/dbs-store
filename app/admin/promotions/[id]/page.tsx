import { notFound } from "next/navigation"
import { getAdminPromotion } from "@/actions/admin/promotions"
import { PromotionForm } from "@/components/admin/promotions/PromotionForm"

interface EditPromotionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPromotionPage({ params }: EditPromotionPageProps) {
  const { id } = await params

  const result = await getAdminPromotion({ id })

  if (!result.data || "error" in result.data || !result.data.promotion) {
    notFound()
  }

  const { promotion } = result.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la promotion</h1>
        <p className="text-muted-foreground">
          Code: <code className="rounded bg-muted px-2 py-1 font-mono">{promotion.code}</code>
        </p>
      </div>
      <PromotionForm
        promotion={{
          ...promotion,
          type: promotion.type as "percentage" | "fixed_amount" | "free_shipping"
        }}
        isEditing
      />
    </div>
  )
}
