import { redirect } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gift, Star, Trophy, Sparkles } from "lucide-react"

export const metadata = {
  title: "Programme fidélité | DBS Store",
  description: "Découvrez vos avantages fidélité",
}

const loyaltyTiers = [
  { name: "Bronze", minPoints: 0, icon: Star, color: "text-orange-600" },
  { name: "Argent", minPoints: 500, icon: Star, color: "text-gray-400" },
  { name: "Or", minPoints: 1500, icon: Trophy, color: "text-yellow-500" },
  { name: "Platine", minPoints: 5000, icon: Sparkles, color: "text-purple-500" },
]

function getCurrentTier(points: number) {
  for (let i = loyaltyTiers.length - 1; i >= 0; i--) {
    if (points >= loyaltyTiers[i].minPoints) {
      return { current: loyaltyTiers[i], next: loyaltyTiers[i + 1] || null }
    }
  }
  return { current: loyaltyTiers[0], next: loyaltyTiers[1] }
}

export default async function LoyaltyPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?redirect=/account/loyalty")
  }

  const points = user.loyalty_points || 0
  const { current, next } = getCurrentTier(points)
  const TierIcon = current.icon

  const progressToNext = next
    ? Math.min(100, ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100)
    : 100
  const pointsToNext = next ? next.minPoints - points : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Programme fidélité</h2>
        <p className="text-sm text-muted-foreground">
          Cumulez des points et profitez d&apos;avantages exclusifs
        </p>
      </div>

      {/* Current status */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TierIcon className={`size-5 ${current.color}`} />
              Niveau {current.name}
            </CardTitle>
            <Badge variant="secondary" className="text-lg font-bold">
              {points} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {next ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Prochain niveau: {next.name}
                </span>
                <span className="font-medium">{pointsToNext} pts restants</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous avez atteint le niveau maximum !
            </p>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4" />
            Comment ça marche ?
          </CardTitle>
          <CardDescription>
            Le programme fidélité sera bientôt disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Gagnez des points</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 1 point pour chaque 1000 FCFA dépensé</li>
              <li>• Points bonus lors d&apos;événements spéciaux</li>
              <li>• Points de parrainage (bientôt)</li>
            </ul>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Utilisez vos points</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Réductions sur vos achats</li>
              <li>• Livraison gratuite</li>
              <li>• Accès aux ventes privées</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tiers overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Niveaux de fidélité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {loyaltyTiers.map((tier) => {
              const Icon = tier.icon
              const isCurrentTier = tier.name === current.name
              return (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isCurrentTier ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-full bg-muted ${tier.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.minPoints === 0
                        ? "Niveau de départ"
                        : `À partir de ${tier.minPoints} pts`}
                    </p>
                  </div>
                  {isCurrentTier && (
                    <Badge className="ml-auto" variant="secondary">
                      Actuel
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
