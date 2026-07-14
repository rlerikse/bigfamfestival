import { useState, useMemo } from 'react';
import { type ColumnDef, type RowSelectionState, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { SideDrawer } from '@/components/shared/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePaginatedQuery, useOptimisticPatch } from '@/hooks/useApi';
import type { User } from '@/types';
import { USER_ROLES } from '@/lib/constants';
import { Pencil, Ban, CheckCircle } from 'lucide-react';
import { getRoleBadgeColor } from '@/lib/role-colors';

// Mock data for when backend isn't available
const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  email: `user${i + 1}@example.com`,
  name: `User ${i + 1}`,
  displayName: `User ${i + 1}`,
  role: USER_ROLES[i % USER_ROLES.length],
  phone: i % 3 === 0 ? `+1555${String(i).padStart(4, '0')}` : undefined,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
  disabled: i % 10 === 0,
}));

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const [drawerUser, setDrawerUser] = useState<User | null>(null);

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const queryKey = ['users', search, roleFilter, String(page)];
  const { data, isLoading } = usePaginatedQuery<User>(
    queryKey,
    '/admin/users',
    { search, role: roleFilter, page, limit: 20 }
  );

  const patchMutation = useOptimisticPatch<User>(queryKey, '/admin/users');

  const startInlineEdit = (user: User, field: string) => {
    setEditingCell({ id: user.id, field });
    setEditValue((user as unknown as Record<string, unknown>)[field] as string ?? '');
  };

  const commitInlineEdit = () => {
    if (!editingCell) return;
    patchMutation.mutate({ id: editingCell.id, data: { [editingCell.field]: editValue } });
    setEditingCell(null);
  };

  const columns: ColumnDef<User, unknown>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.name || user.displayName || 'Unnamed';
        if (editingCell?.id === user.id && editingCell.field === 'name') {
          return (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitInlineEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
              className="h-7 w-40"
              autoFocus
            />
          );
        }
        return (
          <span
            className="cursor-pointer hover:underline"
            onDoubleClick={() => startInlineEdit(user, 'name')}
          >
            {displayName}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        return <Badge className={getRoleBadgeColor(role)}>{role}</Badge>;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'disabled',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.disabled ? 'destructive' : 'secondary'}>
          {row.original.disabled ? 'Disabled' : 'Active'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDrawerUser(row.original)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => patchMutation.mutate({
              id: row.original.id,
              data: { disabled: !row.original.disabled },
            })}
            title={row.original.disabled ? 'Enable' : 'Disable'}
          >
            {row.original.disabled ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Ban className="h-3.5 w-3.5 text-destructive" />
            )}
          </Button>
        </div>
      ),
    },
  ], [editingCell, editValue]);

  const selectedCount = Object.keys(selectedRows).length;

  const handleBulkDisable = () => {
    Object.keys(selectedRows).forEach((id) => {
      patchMutation.mutate({ id, data: { disabled: true } });
    });
    setSelectedRows({});
  };

  const handleBulkRoleChange = (role: string) => {
    Object.keys(selectedRows).forEach((id) => {
      patchMutation.mutate({ id, data: { role } });
    });
    setSelectedRows({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        enableSelection
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        loading={isLoading}
      />

      {/* Bulk action bar */}
      <BulkActionBar count={selectedCount} onClear={() => setSelectedRows({})}>
        <Button size="sm" variant="secondary" onClick={handleBulkDisable}>
          Disable
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleBulkRoleChange('volunteer')}>
          Set Volunteer
        </Button>
      </BulkActionBar>

      {/* Edit drawer */}
      <SideDrawer
        open={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        title={drawerUser ? `Edit: ${drawerUser.name || drawerUser.displayName || 'User'}` : 'Edit User'}
      >
        {drawerUser && <UserEditForm user={drawerUser} onSave={(data) => {
          patchMutation.mutate({ id: drawerUser.id, data });
          setDrawerUser(null);
        }} />}
      </SideDrawer>
    </div>
  );
}

// Drawer form
function UserEditForm({ user, onSave }: { user: User; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    name: user.name || user.displayName || '',
    email: user.email,
    role: user.role,
    phone: user.phone ?? '',
    disabled: user.disabled,
  });

  const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input value={form.email} onChange={(e) => update('email', e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Role</label>
        <select
          value={form.role}
          onChange={(e) => update('role', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.disabled}
          onChange={(e) => update('disabled', e.target.checked)}
        />
        <label className="text-sm">Disabled</label>
      </div>
      <Button onClick={() => onSave(form)} className="w-full">Save Changes</Button>
    </div>
  );
}
