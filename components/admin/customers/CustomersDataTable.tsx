"use client"

import { useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, UserPlus, ShieldCheck, Award } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { getCustomerColumns } from "./columns"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import type { FilterableColumn } from "@/types/data-table"

type Customer = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  role: "customer" | "admin" | "super_admin" | null
  loyalty_points: number | null
  created_at: string | null
  orders_count: number
  total_spent: number
}

interface CustomersDataTableProps {
  customers: Customer[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  totalCount?: number
  stats?: {
    total: number
    customers: number
    admins: number
    newThisMonth: number
    totalLoyaltyPoints: number
  }
}

export function CustomersDataTable({
  customers,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  totalCount,
  stats,
}: CustomersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { setCustomTitle } = useAdminHeader()

  // Set custom title
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Clients (${totalCount})`)
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
      router.push(`/admin/customers?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  const columns = getCustomerColumns()

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
      const searchFilter = filters.find((f) => f.id === "full_name")
      const roleFilter = filters.find((f) => f.id === "role")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          role: Array.isArray(roleFilter?.value)
            ? (roleFilter.value as string[])[0]
            : undefined,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(
    () => [
      {
        id: "role",
        title: "Rôle",
        options: [
          { label: "Client", value: "customer" },
          { label: "Admin", value: "admin" },
          { label: "Super Admin", value: "super_admin" },
        ],
      },
    ],
    []
  )

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "full_name", value: search })
    }
    return filters
  }, [search])

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total clients</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Nouveaux ce mois</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.newThisMonth}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Administrateurs</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.admins}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Points fidélité</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.totalLoyaltyPoints.toLocaleString()}</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={customers}
        toolbar={{
          searchKey: "full_name",
          searchPlaceholder: "Rechercher par nom, téléphone ou email...",
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
    </div>
  )
}
