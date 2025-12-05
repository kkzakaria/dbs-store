import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

/**
 * Filter option for faceted filters
 */
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Filterable column configuration
 */
export interface FilterableColumn {
  id: string;
  title: string;
  options: FilterOption[];
}

/**
 * DataTable toolbar configuration
 */
export interface DataTableToolbarConfig<TData> {
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: FilterableColumn[];
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExport?: (data: TData[]) => void;
  enableExport?: boolean;
}

/**
 * Main DataTable component props
 */
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Toolbar configuration
  toolbar?: DataTableToolbarConfig<TData>;

  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  enablePagination?: boolean;

  // Server-side pagination
  manualPagination?: boolean;
  pageCount?: number;

  // Selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  // Sorting
  enableSorting?: boolean;

  // Column visibility
  enableColumnVisibility?: boolean;

  // States
  isLoading?: boolean;
  emptyMessage?: string;

  // Advanced
  getRowId?: (row: TData) => string;

  // Initial state from URL (for nuqs integration - uncontrolled with URL sync)
  initialColumnFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  initialPagination?: { pageIndex: number; pageSize: number };

  // Callbacks for state changes (called on user interaction, not on mount)
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
}
