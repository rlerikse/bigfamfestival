import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Shift, PaginatedResponse } from '@/types';
import { usePaginatedQuery } from '@/hooks/useApi';

const mockShifts: Shift[] = Array.from({ length: 40 }, (_, i) => ({
  id: `shift-${i + 1}`,
  userId: `user-${(i % 20) + 1}`,
  role: ['security', 'bartender', 'stage-hand', 'parking', 'info-booth'][i % 5],
  date: '2026-07-10',
  startTime: `${8 + (i % 12)}:00`,
  endTime: `${12 + (i % 12)}:00`,
  location: ['Gate A', 'Main Bar', 'Main Stage', 'Lot B', 'Info Tent'][i % 5],
  status: (['scheduled', 'checked-in', 'completed', 'no-show'] as const)[i % 4],
}));

export function ShiftsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const mockResponse: PaginatedResponse<Shift> = {
    data: mockShifts.slice((page - 1) * 20, page * 20),
    total: mockShifts.length,
    page,
    limit: 20,
  };

  const { data, isLoading } = usePaginatedQuery<Shift>(
    ['shifts', search, String(page)],
    '/admin/shifts',
    { search, page, limit: 20 },
    { placeholderData: mockResponse }
  );

  const columns: ColumnDef<Shift, unknown>[] = useMemo(() => [
    { accessorKey: 'role', header: 'Role', enableSorting: true },
    { accessorKey: 'date', header: 'Date', enableSorting: true },
    { accessorKey: 'startTime', header: 'Start' },
    { accessorKey: 'endTime', header: 'End' },
    { accessorKey: 'location', header: 'Location' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = s === 'completed' ? 'default' : s === 'no-show' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shifts</h1>
      <Input
        placeholder="Search shifts..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-xs"
      />
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        loading={isLoading}
      />
    </div>
  );
}
