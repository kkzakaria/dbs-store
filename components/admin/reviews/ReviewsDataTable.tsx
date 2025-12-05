"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Star, Clock, CheckCircle, MessageSquare } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getReviewColumns } from "./columns"
import { approveReview, rejectReview } from "@/actions/admin/reviews"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { toast } from "sonner"
import type { FilterableColumn, FilterOption } from "@/types/data-table"

type Review = {
  id: string
  title: string | null
  comment: string | null
  rating: number
  is_approved: boolean | null
  is_verified_purchase: boolean | null
  created_at: string | null
  product: { id: string; name: string; slug: string } | null
  user: { id: string; full_name: string | null; phone: string | null } | null
}

interface ReviewsDataTableProps {
  reviews: Review[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  totalCount?: number
  stats?: {
    total: number
    pending: number
    approved: number
    averageRating: number
  }
}

export function ReviewsDataTable({
  reviews,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  totalCount,
  stats,
}: ReviewsDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const { setCustomTitle } = useAdminHeader()

  // Set custom title
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Avis clients (${totalCount})`)
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
      router.push(`/admin/reviews?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle approve
  const handleApprove = useCallback((review: Review) => {
    startTransition(async () => {
      const result = await approveReview({ id: review.id })

      if (result?.data?.success) {
        toast.success("Avis approuvé")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de l'approbation")
      }
    })
  }, [router])

  // Handle reject confirmation
  const handleRejectClick = useCallback((review: Review) => {
    setReviewToDelete(review)
    setDeleteDialogOpen(true)
  }, [])

  // Handle reject
  const handleReject = useCallback(async () => {
    if (!reviewToDelete) return

    startTransition(async () => {
      const result = await rejectReview({ id: reviewToDelete.id })

      if (result?.data?.success) {
        toast.success("Avis supprimé")
        setDeleteDialogOpen(false)
        setReviewToDelete(null)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
    })
  }, [reviewToDelete, router])

  const columns = getReviewColumns({
    onApprove: handleApprove,
    onReject: handleRejectClick,
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
      const searchFilter = filters.find((f) => f.id === "content")
      const statusFilter = filters.find((f) => f.id === "status")

      // Map status filter values to isApproved param
      const statusValues = (statusFilter?.value as string[]) || []
      let isApprovedParam: boolean | undefined
      if (statusValues.includes("pending") && !statusValues.includes("approved")) {
        isApprovedParam = false
      } else if (statusValues.includes("approved") && !statusValues.includes("pending")) {
        isApprovedParam = true
      }

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          isApproved: isApprovedParam,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build status filter options with counts
  const statusOptions: FilterOption[] = useMemo(() => [
    {
      label: `En attente (${stats?.pending ?? 0})`,
      value: "pending",
      icon: Clock,
    },
    {
      label: `Approuves (${stats?.approved ?? 0})`,
      value: "approved",
      icon: CheckCircle,
    },
  ], [stats?.pending, stats?.approved])

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(() => [
    {
      id: "status",
      title: "Statut",
      options: statusOptions,
    },
  ], [statusOptions])

  // Build initial filters from URL (including status filters)
  const approvedFilter = searchParams.get("isApproved")

  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "content", value: search })
    }
    // Map URL param to status filter values
    if (approvedFilter === "false") {
      filters.push({ id: "status", value: ["pending"] })
    } else if (approvedFilter === "true") {
      filters.push({ id: "status", value: ["approved"] })
    }
    return filters
  }, [search, approvedFilter])

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total avis</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">En attente</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Approuves</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Note moyenne</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.averageRating}/5</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={reviews}
        toolbar={{
          searchKey: "content",
          searchPlaceholder: "Rechercher dans les avis...",
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
        title="Supprimer l'avis"
        description="Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible."
        onConfirm={handleReject}
        loading={isPending}
        variant="destructive"
      />
    </div>
  )
}
