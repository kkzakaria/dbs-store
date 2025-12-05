import { PromotionForm } from "@/components/admin/promotions/PromotionForm"

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle promotion</h1>
        <p className="text-muted-foreground">
          Créez un nouveau code promo pour vos clients
        </p>
      </div>
      <PromotionForm />
    </div>
  )
}
