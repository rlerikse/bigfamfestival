import { useApiQuery } from '@/hooks/useApi';
import type { Event } from '@/types';

interface ArtistEventsChipsProps {
  artistId: string; // slug or id used in Event.artists[]
}

/**
 * Read-only "Appears in" chips — computed client-side from all events whose
 * `artists` array includes this artist's slug/ID. No schema change; purely
 * derived from existing Event data.
 */
export function ArtistEventsChips({ artistId }: ArtistEventsChipsProps) {
  const { data: eventsData, isLoading } = useApiQuery<Event[]>(['events-all-for-artist'], '/events');
  const allEvents = Array.isArray(eventsData) ? eventsData : [];
  const appearsIn = allEvents.filter((e) => e.artists?.includes(artistId));

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading events…</p>;
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">Appears in</label>
      {appearsIn.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not scheduled on any events yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {appearsIn.map((event) => (
            <a
              key={event.id}
              href={`/events?view=list`}
              title={`${event.date} · ${event.stage}`}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              {event.name}
            </a>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Read-only — edit lineup from the event, not here.
      </p>
    </div>
  );
}
