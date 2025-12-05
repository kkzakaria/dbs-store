"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Tag, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getPromotionColumns } from "./columns"
import { deletePromotion, togglePromotionStatus } from "@/actions/admin/promotions"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { toast } from "sonner"
import type { FilterableColumn } from "@/types/data-table"

type Promotion = {
  id: string
  code: string
  name: string
  description: string | null
  type: "percentage" | "fixed_amount" | "free_shipping"
  value: number
  min_purchase: number | null
  max_discount: number | null
  max_uses: number | null
  used_count: number | null
  starts_at: string
  ends_at: string
  is_active: boolean | null
}

interface PromotionsDataTableProps {
  promotions: Promotion[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  totalCount?: number
  stats?: {
    total: number
    active: number
    expired: number
    scheduled: number
  }
}

export function PromotionsDataTable({
  promotions,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  totalCount,
  stats,
}: PromotionsDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)
  const { setCustomTitle } = useAdminHeader()

  // Set custom title
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Promotions (${totalCount})`)
    }
    return () => setCustomTitle(null)
  }, [totalCount, setCustomTitle])

  // Update URL with new params
  const updateUrlParams = useCallback(
    (params: Record<string, string | number | boolean | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === 1 || value === false) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
      router.push(`/admin/promotions?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle edit
  const handleEdit = useCallback((promotion: Promotion) => {
    router.push(`/admin/promotions/${promotion.id}`)
  }, [router])

  // Handle delete confirmation
  const handleDeleteClick = useCallback((promotion: Promotion) => {
    setPromotionToDelete(promotion)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!promotionToDelete) return

    startTransition(async () => {
      const result = await deletePromotion({ id: promotionToDelete.id })

      if (result?.data?.success) {
        toast.success("Promotion supprimée")
        setDeleteDialogOpen(false)
        setPromotionToDelete(null)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
    })
  }, [promotionToDelete, router])

  // Handle toggle status
  const handleToggleStatus = useCallback((promotion: Promotion) => {
    startTransition(async () => {
      const result = await togglePromotionStatus({ id: promotion.id })

      if (result?.data?.success) {
        toast.success(promotion.is_active ? "Promotion désactivée" : "Promotion activée")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors du changement de statut")
      }
    })
  }, [router])

  const columns = getPromotionColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onToggleStatus: handleToggleStatus,
  })

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      startTransition(() => {
        updateUrlParams({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        })
      })
    },
    [updateUrlParams]
  )

  // Handle search
  const handleColumnFiltersChange = useCallback(
    (filters: { id: string; value: unknown }[]) => {
      const searchFilter = filters.find((f) => f.id === "name")
      const typeFilter = filters.find((f) => f.id === "type")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          type: Array.isArray(typeFilter?.value)
            ? (typeFilter.value as string[])[0]
            : undefined,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(() => [
    {
      id: "type",
      title: "Type",
      options: [
        { label: "Pourcentage", value: "percentage" },
        { label: "Montant fixe", value: "fixed_amount" },
        { label: "Livraison gratuite", value: "free_shipping" },
      ],
    },
  ], [])

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "name", value: search })
    }
    return filters
  }, [search])

  // Quick filter buttons
  const activeFilter = searchParams.get("isActive")

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Actives</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Programmées</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expirées</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.expired}</p>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateUrlParams({ isActive: activeFilter === "true" ? undefined : true, page: 1 })}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            activeFilter === "true"
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20"
              : "hover:bg-muted"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Actives uniquement
        </button>
        <button
          onClick={() => updateUrlParams({ isActive: activeFilter === "false" ? undefined : false, page: 1 })}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            activeFilter === "false"
              ? "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-900/20"
              : "hover:bg-muted"
          }`}
        >
          <XCircle className="h-4 w-4" />
          Inactives uniquement
        </button>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/promotions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle promotion
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={promotions}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom ou code...",
          onRefresh: () => router.refresh(),
          isRefreshing: isPending,
          filterableColumns,
        }}
        manualPagination
        pageCount={pageCount}
        initialPagination={{
          pageIndex: currentPage - 1,
          pageSize,
        }}
        initialColumnFilters={initialFilters}
        onPaginationChange={handlePaginationChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        isLoading={isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer la promotion"
        description={`Êtes-vous sûr de vouloir supprimer la promotion "${promotionToDelete?.name}" (${promotionToDelete?.code}) ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        loading={isPending}
        variant="destructive"
      />
    </div>
  )
}
