import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { EditModal } from '@/components/shared/EditModal';
import { EventForm } from '@/components/events/EventForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { usePaginatedQuery, useCreateEvent, useUpdateEvent } from '@/hooks/useApi';
import type { Event } from '@/types';

interface Props {
  search: string;
  stage: string;
  upcomingOnly: boolean;
}

export function EventsListView({ search, stage, upcomingOnly }: Props) {
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data, isLoading } = usePaginatedQuery<Event>(
    ['events', search, stage, String(page)],
    '/events',
    { search, stage, page, limit: 20 }
  );

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const openCreate = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (formData: {
    name: string;
    artists: string[];
    stage: string;
    date: string;
    startTime: string;
    endTime: string;
    imageUrl: string;
  }) => {
    if (editingEvent) {
      await updateMutation.mutateAsync({ id: editingEvent.id, data: formData as unknown as Record<string, unknown> });
    } else {
      await createMutation.mutateAsync(formData as unknown as Record<string, unknown>);
    }
    closeModal();
  };

  const columns: ColumnDef<Event, unknown>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Event',
      enableSorting: true,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => <Badge variant="secondary">{row.original.stage}</Badge>,
      enableSorting: true,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      enableSorting: true,
    },
    {
      accessorKey: 'startTime',
      header: 'Start',
    },
    {
      accessorKey: 'endTime',
      header: 'End',
    },
    {
      accessorKey: 'artists',
      header: 'Artists',
      cell: ({ row }) => row.original.artists?.join(', ') || '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => openEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ], []);

  // Client-side upcoming filter
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const filteredData = useMemo(() => {
    const events = data?.data ?? [];
    if (!upcomingOnly) return events;
    return events.filter((e) => e.date >= today);
  }, [data?.data, upcomingOnly, today]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        total={upcomingOnly ? filteredData.length : (data?.total ?? 0)}
        page={page}
        onPageChange={setPage}
        loading={isLoading}
      />

      {/* Create / Edit Modal */}
      <EditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingEvent ? `Edit: ${editingEvent.name}` : 'Add Event'}
      >
        <EventForm
          key={editingEvent?.id ?? 'new'}
          event={editingEvent ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </EditModal>
    </div>
  );
}
