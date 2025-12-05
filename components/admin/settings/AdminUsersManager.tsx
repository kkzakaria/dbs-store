"use client"

import { useEffect } from "react"
import { Users, Shield, ShieldCheck } from "lucide-react"
import { AdminUserCard } from "./AdminUserCard"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { Card, CardContent } from "@/components/ui/card"

type AdminUser = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: "admin" | "super_admin" | null
  created_at: string | null
  avatar_url: string | null
}

interface AdminUsersManagerProps {
  users: AdminUser[]
  currentUserId: string
  currentUserRole: string | null
}

export function AdminUsersManager({ users, currentUserId, currentUserRole }: AdminUsersManagerProps) {
  const { setCustomTitle } = useAdminHeader()

  const adminsCount = users.filter((u) => u.role === "admin").length
  const superAdminsCount = users.filter((u) => u.role === "super_admin").length

  // Set custom title
  useEffect(() => {
    setCustomTitle(`Paramètres - Utilisateurs (${users.length})`)
    return () => setCustomTitle(null)
  }, [users.length, setCustomTitle])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Utilisateurs administrateurs</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{adminsCount}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ShieldCheck className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{superAdminsCount}</p>
              <p className="text-sm text-muted-foreground">Super Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Grid */}
      {users.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucun utilisateur admin</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Il n&apos;y a pas encore d&apos;utilisateurs avec des droits admin
          </p>
        </div>
      )}
    </div>
  )
}
