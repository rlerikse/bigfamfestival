import { useApiQuery } from '@/hooks/useApi';
import { apiPatch } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ScheduleEditor } from '@/components/schedule/ScheduleEditor';
import type { Event } from '@/types';

const EVENTS_QUERY_KEY = ['events', 'schedule-editor'];

export function SchedulePage() {
  const queryClient = useQueryClient();
  const { data: events, isLoading, error } = useApiQuery<Event[]>(EVENTS_QUERY_KEY, '/events');

  async function handleUpdateEvent(id: string, patch: Partial<Event>) {
    await apiPatch<Event>(`/events/${id}`, patch as Record<string, unknown>);
    // Server is authoritative for festivalDay recompute etc. — refetch to pick up
    // any derived fields we didn't optimistically set (e.g. festivalDay changes).
    await queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Schedule</h1>
      <p className="text-muted-foreground">
        Drag/resize schedule editor — Apogee, Bayou, Gallery. 15-minute grid,
        festival days run 6:00 AM &rarr; 6:00 AM next day.
      </p>

      {isLoading && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          Loading schedule&hellip;
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 text-red-200 text-sm px-3 py-2">
          Failed to load events: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && (
        <ScheduleEditor events={events ?? []} onUpdateEvent={handleUpdateEvent} />
      )}
    </div>
  );
}
