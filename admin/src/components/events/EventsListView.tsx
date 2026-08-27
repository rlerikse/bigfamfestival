import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { EditModal } from '@/components/shared/EditModal';
import { EventForm } from '@/components/events/EventForm';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePaginatedQuery, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useApi';
import { useStorageUrl } from '@/hooks/useStorageUrl';
import type { Event } from '@/types';

function EventImageCell({ imageUrl }: { imageUrl?: string }) {
  const resolved = useStorageUrl(imageUrl);
  if (!resolved) return <span className="text-muted-foreground text-xs">—</span>;
  return <img src={resolved} alt="" className="h-8 w-8 min-w-8 rounded-full object-cover aspect-square" />;
}

// Checkbox that publishes/unpublishes an event by toggling its `hidden` field.
// Checked = published (visible to everyone); unchecked = hidden from the public.
function PublishedCell({ event }: { event: Event }) {
  const updateMutation = useUpdateEvent();
  const [checked, setChecked] = useState(event.hidden !== true);
  useEffect(() => { setChecked(event.hidden !== true); }, [event.hidden]);

  const onToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setChecked(next); // optimistic
    updateMutation.mutate(
      { id: event.id, data: { hidden: !next } },
      { onError: () => setChecked(!next) },
    );
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={updateMutation.isPending}
      onChange={onToggle}
      title={checked ? 'Visible to everyone — uncheck to hide from the public' : 'Hidden from the public — check to publish'}
      className="h-4 w-4 cursor-pointer accent-green-600 disabled:opacity-50"
    />
  );
}

// Red trash button that deletes an event after a confirmation prompt.
function DeleteEventButton({ event }: { event: Event }) {
  const deleteMutation = useDeleteEvent();
  const onDelete = () => {
    if (!window.confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(event.id);
  };
  return (
    <button
      type="button"
      className="p-1.5 rounded text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      onClick={onDelete}
      disabled={deleteMutation.isPending}
      title="Delete event"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

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
    '/admin/events',
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
    description: string;
  }) => {
    if (editingEvent) {
      // Strip empty strings and only send changed fields to avoid backend validation errors
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      );
      await updateMutation.mutateAsync({ id: editingEvent.id, data: cleanData });
    } else {
      await createMutation.mutateAsync(formData as unknown as Record<string, unknown>);
    }
    closeModal();
  };

  const columns: ColumnDef<Event, unknown>[] = useMemo(() => [
    {
      id: 'image',
      header: '',
      cell: ({ row }) => <EventImageCell imageUrl={row.original.imageUrl} />,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Event',
      enableSorting: true,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => {
        const stage = row.original.stage;
        const logoMap: Record<string, string> = {
          'Apogee': '/stages/apogee-logo-trans.png',
          'Bayou': '/stages/bayou-logo-trans.png',
          'The Gallery': '/stages/the-gallery-logo-trans.png',
          'Gallery': '/stages/gallery-logo-trans.png',
        };
        const logo = logoMap[stage];
        if (logo) return <img src={logo} alt={stage} title={stage} className="h-6 object-contain" />;
        return <span className="text-sm text-muted-foreground">{stage}</span>;
      },
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
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{desc}</span>;
      },
    },
    {
      id: 'published',
      header: 'Published',
      cell: ({ row }) => <PublishedCell event={row.original} />,
      size: 90,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => openEdit(row.original)}
            title="Edit event"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <DeleteEventButton event={row.original} />
        </div>
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
        title={editingEvent ? 'Edit Event' : 'Add Event'}
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
