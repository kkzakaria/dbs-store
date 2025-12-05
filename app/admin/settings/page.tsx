import { Suspense } from "react"
import { getShippingZones } from "@/actions/admin/settings"
import { getAdminUsers } from "@/actions/admin/users"
import { getCurrentUser } from "@/actions/auth"
import { ShippingZonesManager } from "@/components/admin/settings/ShippingZonesManager"
import { AdminUsersManager } from "@/components/admin/settings/AdminUsersManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Store, Settings2, Users } from "lucide-react"

export default async function AdminSettingsPage() {
  const [shippingResult, usersResult, currentUser] = await Promise.all([
    getShippingZones(),
    getAdminUsers({ page: 1, limit: 50 }),
    getCurrentUser(),
  ])

  if ("error" in shippingResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{shippingResult.error}</p>
      </div>
    )
  }

  const zones = shippingResult.zones || []
  const adminUsers = usersResult?.data?.users || []

  return (
    <div className="space-y-6">
      <Tabs defaultValue="shipping" className="w-full">
        <TabsList>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2" disabled>
            <Store className="h-4 w-4" />
            Boutique
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2" disabled>
            <Settings2 className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping" className="mt-6">
          <Suspense fallback={<div>Chargement...</div>}>
            <ShippingZonesManager zones={zones} />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Suspense fallback={<div>Chargement...</div>}>
            <AdminUsersManager
              users={adminUsers}
              currentUserId={currentUser?.id || ""}
              currentUserRole={currentUser?.role || null}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="store" className="mt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Paramètres boutique</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bientôt disponible
            </p>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Paramètres généraux</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bientôt disponible
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
