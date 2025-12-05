"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tag, Clock, CheckCircle, XCircle } from "lucide-react"
import { DataTable } from "@/components/data-table"
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
  isActiveFilter?: string
  typeFilter?: string
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
  isActiveFilter,
  typeFilter,
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

  // Handle search and filters
  const handleColumnFiltersChange = useCallback(
    (filters: { id: string; value: unknown }[]) => {
      const searchFilter = filters.find((f) => f.id === "name")
      const typeFilterValue = filters.find((f) => f.id === "type")
      const statusFilter = filters.find((f) => f.id === "is_active")

      startTransition(() => {
        // Extract isActive value from status filter
        let isActiveValue: boolean | undefined = undefined
        if (Array.isArray(statusFilter?.value) && statusFilter.value.length > 0) {
          isActiveValue = statusFilter.value[0] === "true"
        }

        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          type: Array.isArray(typeFilterValue?.value)
            ? (typeFilterValue.value as string[])[0]
            : undefined,
          isActive: isActiveValue,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Handle add new promotion
  const handleAdd = useCallback(() => {
    router.push("/admin/promotions/new")
  }, [router])

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
    {
      id: "is_active",
      title: "Statut",
      options: [
        { label: "Actives", value: "true" },
        { label: "Inactives", value: "false" },
      ],
    },
  ], [])

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "name", value: search })
    }
    if (typeFilter) {
      filters.push({ id: "type", value: [typeFilter] })
    }
    if (isActiveFilter) {
      filters.push({ id: "is_active", value: [isActiveFilter] })
    }
    return filters
  }, [search, typeFilter, isActiveFilter])

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

      <DataTable
        columns={columns}
        data={promotions}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom ou code...",
          onRefresh: () => router.refresh(),
          isRefreshing: isPending,
          filterableColumns,
          onAdd: handleAdd,
          addLabel: "Nouvelle promotion",
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
