import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Vendor, PaginatedResponse } from '@/types';

const mockVendors: Vendor[] = Array.from({ length: 25 }, (_, i) => ({
  id: `vendor-${i + 1}`,
  name: `Vendor ${i + 1}`,
  category: ['Food', 'Drinks', 'Merch', 'Art', 'Services'][i % 5],
  contactEmail: `vendor${i + 1}@example.com`,
  contactPhone: `+1555${String(100 + i).padStart(4, '0')}`,
  boothLocation: `Zone ${String.fromCharCode(65 + (i % 4))}-${(i % 10) + 1}`,
  status: (['pending', 'approved', 'rejected'] as const)[i % 3],
}));

export function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Vendors endpoint doesn't exist yet — using placeholder data
  const filtered = useMemo(() => {
    if (!search) return mockVendors;
    const q = search.toLowerCase();
    return mockVendors.filter(v => v.name.toLowerCase().includes(q) || v.contactEmail.toLowerCase().includes(q));
  }, [search]);

  const data: PaginatedResponse<Vendor> = {
    data: filtered.slice((page - 1) * 20, page * 20),
    total: filtered.length,
    page,
    limit: 20,
  };

  const columns: ColumnDef<Vendor, unknown>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    { accessorKey: 'contactEmail', header: 'Email' },
    { accessorKey: 'boothLocation', header: 'Booth' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
  ], []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendors</h1>
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
        ⚠️ Vendor API not yet connected — showing placeholder data
      </div>
      <Input
        placeholder="Search vendors..."
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
        loading={false}
      />
    </div>
  );
}
