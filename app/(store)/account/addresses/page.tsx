import { EmptyState } from "@/components/shared/EmptyState"
import { MapPin } from "lucide-react"

export const metadata = {
  title: "Mes adresses | DBS Store",
  description: "Gérez vos adresses de livraison",
}

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Mes adresses</h2>
        <p className="text-sm text-muted-foreground">
          Gérez vos adresses de livraison
        </p>
      </div>

      <EmptyState
        icon={<MapPin className="size-8" />}
        title="Bientôt disponible"
        description="La gestion des adresses sera disponible prochainement. Vous pourrez ajouter et gérer vos adresses de livraison."
      />
    </div>
  )
}
