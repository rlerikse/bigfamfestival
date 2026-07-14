import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  total: number;
  pageSize?: number;
  page: number;
  onPageChange: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  enableSelection?: boolean;
  selectedRows?: RowSelectionState;
  onSelectedRowsChange?: (selection: RowSelectionState) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns: userColumns,
  total,
  pageSize = 20,
  page,
  onPageChange,
  sorting = [],
  onSortingChange,
  enableSelection = false,
  selectedRows = {},
  onSelectedRowsChange,
  loading = false,
}: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>(sorting);

  const effectiveSorting = onSortingChange ? sorting : internalSorting;
  const handleSortingChange = onSortingChange ?? setInternalSorting;

  const selectionColumn: ColumnDef<T, unknown> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    size: 40,
  };

  const allColumns = enableSelection ? [selectionColumn, ...userColumns] : userColumns;

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  const table = useReactTable({
    data,
    columns: allColumns,
    pageCount: Math.ceil(total / pageSize),
    state: {
      pagination,
      sorting: effectiveSorting,
      rowSelection: selectedRows,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(effectiveSorting) : updater;
      handleSortingChange(newSorting);
    },
    onRowSelectionChange: (updater) => {
      if (!onSelectedRowsChange) return;
      const newSelection = typeof updater === 'function' ? updater(selectedRows) : updater;
      onSelectedRowsChange(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: onSortingChange ? undefined : getSortedRowModel(),
    manualPagination: true,
    manualSorting: !!onSortingChange,
    enableRowSelection: enableSelection,
    getRowId: (row) => row.id,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#FAFAF2]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                        {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                        {!header.column.getIsSorted() && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={allColumns.length} className="h-32 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length} className="h-32 text-center text-muted-foreground">
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-t border-border hover:bg-[#F4F2E6] transition-colors',
                    row.getIsSelected() && 'bg-accent/50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
