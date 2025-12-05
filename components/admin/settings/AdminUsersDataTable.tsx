"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Shield, ShieldCheck } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { getAdminUsersColumns, type AdminUser } from "./admin-users-columns"
import { AddAdminDialog } from "./AddAdminDialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { updateUserRole, deleteAdminUser } from "@/actions/admin/users"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { toast } from "sonner"
import type { FilterableColumn } from "@/types/data-table"

interface AdminUsersDataTableProps {
  users: AdminUser[]
  currentUserId: string
  currentUserRole: string | null
}

export function AdminUsersDataTable({
  users,
  currentUserId,
  currentUserRole,
}: AdminUsersDataTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { setCustomTitle } = useAdminHeader()

  // Dialog state for role change
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [newRole, setNewRole] = useState<"admin" | "super_admin">("admin")

  // Dialog state for delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  // Stats
  const adminsCount = users.filter((u) => u.role === "admin").length
  const superAdminsCount = users.filter((u) => u.role === "super_admin").length

  const isSuperAdmin = currentUserRole === "super_admin"

  // Set custom title
  useEffect(() => {
    setCustomTitle(`Paramètres - Utilisateurs (${users.length})`)
    return () => setCustomTitle(null)
  }, [users.length, setCustomTitle])

  // Handle role change request
  const handleRoleChangeRequest = (user: AdminUser, role: "admin" | "super_admin") => {
    setSelectedUser(user)
    setNewRole(role)
    setRoleDialogOpen(true)
  }

  // Handle delete request
  const handleDeleteRequest = (user: AdminUser) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  // Execute role change
  const handleRoleChange = () => {
    if (!selectedUser) return

    startTransition(async () => {
      const result = await updateUserRole({ userId: selectedUser.id, role: newRole })

      if (result?.data?.success) {
        toast.success(
          newRole === "super_admin"
            ? `${selectedUser.full_name || "Utilisateur"} promu Super Admin`
            : `${selectedUser.full_name || "Utilisateur"} rétrogradé en Admin`
        )
        setRoleDialogOpen(false)
        setSelectedUser(null)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors du changement de rôle")
      }
    })
  }

  // Execute delete
  const handleDelete = () => {
    if (!userToDelete) return

    startTransition(async () => {
      const result = await deleteAdminUser({ userId: userToDelete.id })

      if (result?.data?.success) {
        toast.success(`${userToDelete.full_name || "Utilisateur"} retiré des administrateurs`)
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
    })
  }

  // Get columns with actions
  const columns = useMemo(
    () =>
      getAdminUsersColumns({
        currentUserId,
        currentUserRole,
        onRoleChange: handleRoleChangeRequest,
        onDelete: handleDeleteRequest,
      }),
    [currentUserId, currentUserRole]
  )

  // Filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(
    () => [
      {
        id: "role",
        title: "Rôle",
        options: [
          { label: "Admin", value: "admin" },
          { label: "Super Admin", value: "super_admin" },
        ],
      },
    ],
    []
  )

  return (
    <>
      <div className="space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Utilisateurs administrateurs</h2>
          </div>
          {isSuperAdmin && <AddAdminDialog />}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{users.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-500">{adminsCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Super Admins</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-destructive">{superAdminsCount}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users}
          toolbar={{
            searchKey: "full_name",
            searchPlaceholder: "Rechercher par nom, email...",
            onRefresh: () => router.refresh(),
            isRefreshing: isPending,
            filterableColumns,
          }}
          pageSize={10}
          emptyMessage="Aucun utilisateur administrateur"
          isLoading={isPending}
        />
      </div>

      {/* Role Change Dialog */}
      <ConfirmDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        title="Changer le rôle"
        description={
          selectedUser?.role === "super_admin"
            ? `Êtes-vous sûr de vouloir rétrograder ${selectedUser?.full_name || "cet utilisateur"} en Admin ? Il perdra les droits de super admin.`
            : `Êtes-vous sûr de vouloir promouvoir ${selectedUser?.full_name || "cet utilisateur"} en Super Admin ? Il aura tous les droits.`
        }
        onConfirm={handleRoleChange}
        loading={isPending}
        variant={selectedUser?.role === "super_admin" ? "destructive" : "default"}
        confirmText={selectedUser?.role === "super_admin" ? "Rétrograder" : "Promouvoir"}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'administrateur"
        description={`Êtes-vous sûr de vouloir retirer ${userToDelete?.full_name || "cet utilisateur"} des administrateurs ? Il sera rétrogradé en client.`}
        onConfirm={handleDelete}
        loading={isPending}
        variant="destructive"
        confirmText="Supprimer"
      />
    </>
  )
}
