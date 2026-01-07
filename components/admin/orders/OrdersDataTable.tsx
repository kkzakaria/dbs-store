"use client"

import { useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Package, CreditCard, Clock, CheckCircle, XCircle, Truck } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { getOrderColumns } from "./columns"
import { updateOrderStatus, updatePaymentStatus } from "@/actions/admin/orders"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validations/admin"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"
import type { FilterableColumn } from "@/types/data-table"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  user?: {
    id: string
    full_name: string | null
    phone: string | null
    email: string | null
  } | null
  items?: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_snapshot: unknown
  }> | null
}

interface OrdersDataTableProps {
  orders: Order[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  statusFilter?: string
  paymentStatusFilter?: string
  totalCount?: number
}

export function OrdersDataTable({
  orders,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  statusFilter,
  paymentStatusFilter,
  totalCount,
}: OrdersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { setCustomTitle } = useAdminHeader()

  // Set custom title with order count
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Commandes (${totalCount})`)
    }
    return () => setCustomTitle(null)
  }, [totalCount, setCustomTitle])

  // Update URL with new params
  const updateUrlParams = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === 1) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
      router.push(`/admin/orders?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle update order status
  const handleUpdateStatus = useCallback((id: string, status: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus({ id, status: status as never })
      if (result?.data?.success) {
        toast.success(`Statut mis à jour: ${ORDER_STATUS_LABELS[status]}`)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }, [router])

  // Handle update payment status
  const handleUpdatePaymentStatus = useCallback((id: string, status: string) => {
    startTransition(async () => {
      const result = await updatePaymentStatus({ id, paymentStatus: status as never })
      if (result?.data?.success) {
        toast.success(`Statut paiement mis à jour: ${PAYMENT_STATUS_LABELS[status]}`)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }, [router])

  const columns = getOrderColumns({
    onUpdateStatus: handleUpdateStatus,
    onUpdatePaymentStatus: handleUpdatePaymentStatus,
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

  // Handle search via column filters
  const handleColumnFiltersChange = useCallback(
    (filters: { id: string; value: unknown }[]) => {
      const searchFilter = filters.find((f) => f.id === "order_number")
      const statusFilterValue = filters.find((f) => f.id === "status")
      const paymentFilter = filters.find((f) => f.id === "payment_status")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          status: Array.isArray(statusFilterValue?.value)
            ? (statusFilterValue.value as string[]).join(",")
            : undefined,
          paymentStatus: Array.isArray(paymentFilter?.value)
            ? (paymentFilter.value as string[]).join(",")
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
      id: "status",
      title: "Statut",
      options: [
        { label: "En attente", value: "pending", icon: Clock },
        { label: "Confirmée", value: "confirmed", icon: CheckCircle },
        { label: "En préparation", value: "processing", icon: Package },
        { label: "Expédiée", value: "shipped", icon: Truck },
        { label: "Livrée", value: "delivered", icon: CheckCircle },
        { label: "Annulée", value: "cancelled", icon: XCircle },
      ],
    },
    {
      id: "payment_status",
      title: "Paiement",
      options: [
        { label: "En attente", value: "pending", icon: Clock },
        { label: "Payée", value: "paid", icon: CheckCircle },
        { label: "Échouée", value: "failed", icon: XCircle },
        { label: "Remboursée", value: "refunded", icon: CreditCard },
      ],
    },
  ], [])

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "order_number", value: search })
    }
    if (statusFilter) {
      filters.push({ id: "status", value: statusFilter.split(",") })
    }
    if (paymentStatusFilter) {
      filters.push({ id: "payment_status", value: paymentStatusFilter.split(",") })
    }
    return filters
  }, [search, statusFilter, paymentStatusFilter])

  return (
    <DataTable
      columns={columns}
      data={orders}
      toolbar={{
        searchKey: "order_number",
        searchPlaceholder: "Rechercher par n° commande...",
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
      enableRowSelection
      isLoading={isPending}
    />
  )
}
