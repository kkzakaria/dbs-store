"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Shield, ShieldCheck, Mail, Phone, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { updateUserRole } from "@/actions/admin/users"
import { toast } from "sonner"

type AdminUser = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: "admin" | "super_admin" | null
  created_at: string | null
  avatar_url: string | null
}

interface AdminUserCardProps {
  user: AdminUser
  currentUserId: string
  currentUserRole: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
}

export function AdminUserCard({ user, currentUserId, currentUserRole }: AdminUserCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const isCurrentUser = user.id === currentUserId
  const isSuperAdmin = currentUserRole === "super_admin"
  const canChangeRole = isSuperAdmin && !isCurrentUser

  const newRole = user.role === "super_admin" ? "admin" : "super_admin"

  const handleRoleChange = () => {
    startTransition(async () => {
      const result = await updateUserRole({ userId: user.id, role: newRole })

      if (result?.data?.success) {
        toast.success(`Rôle changé en ${ROLE_LABELS[newRole]}`)
        setRoleDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors du changement de rôle")
      }
    })
  }

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-"

  return (
    <>
      <Card className={isCurrentUser ? "ring-2 ring-primary" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {user.full_name || "Sans nom"}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(vous)</span>
                  )}
                </CardTitle>
              </div>
            </div>
            <Badge variant={user.role === "super_admin" ? "destructive" : "default"}>
              {user.role === "super_admin" ? (
                <ShieldCheck className="mr-1 h-3 w-3" />
              ) : (
                <Shield className="mr-1 h-3 w-3" />
              )}
              {ROLE_LABELS[user.role || "admin"]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contact Info */}
          {user.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Inscrit le {formattedDate}</span>
          </div>

          {/* Actions */}
          {canChangeRole && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleDialogOpen(true)}
                disabled={isPending}
              >
                {user.role === "super_admin" ? (
                  <>
                    <Shield className="mr-1 h-4 w-4" />
                    Rétrograder en Admin
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1 h-4 w-4" />
                    Promouvoir Super Admin
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        title="Changer le rôle"
        description={
          user.role === "super_admin"
            ? `Êtes-vous sûr de vouloir rétrograder ${user.full_name || "cet utilisateur"} en Admin ? Il perdra les droits de super admin.`
            : `Êtes-vous sûr de vouloir promouvoir ${user.full_name || "cet utilisateur"} en Super Admin ? Il aura tous les droits.`
        }
        onConfirm={handleRoleChange}
        loading={isPending}
        variant={user.role === "super_admin" ? "destructive" : "default"}
        confirmText={user.role === "super_admin" ? "Rétrograder" : "Promouvoir"}
      />
    </>
  )
}
