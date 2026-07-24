import { useMemo, useState } from 'react';
import type { Event } from '@/types';
import { cn } from '@/lib/utils';
import { mockScheduleEvents } from './scheduleMockData';
import {
  STAGE_COLUMNS,
  DAY_START_HOUR,
  DAY_END_HOUR,
  TOTAL_MINUTES,
  HEADER_HEIGHT,
  TIME_GUTTER_WIDTH,
  STAGE_COLUMN_MIN_WIDTH,
  PX_PER_MINUTE,
  BLOCK_TYPE_COLORS,
  formatColumnHour,
  formatFestivalDayLabel,
  timeToColumnMinutes,
} from '@/lib/scheduleGrid';

interface Props {
  /** Injectable for future real-data wiring; defaults to mocked events for #169 dev. */
  events?: Event[];
}

interface PositionedEvent extends Event {
  topPx: number;
  heightPx: number;
}

const HOUR_HEIGHT = 60 * PX_PER_MINUTE;

export function ScheduleEditor({ events }: Props) {
  const allEvents = events ?? mockScheduleEvents;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Group events by festivalDay (data-driven: supports N days without code changes).
  const { festivalDays, eventsByDayAndStage } = useMemo(() => {
    const days = new Set<string>();
    const byKey = new Map<string, Event[]>();

    for (const ev of allEvents) {
      const day = ev.festivalDay ?? ev.date;
      days.add(day);
      const key = `${day}::${ev.stage}`;
      const existing = byKey.get(key) || [];
      existing.push(ev);
      byKey.set(key, existing);
    }

    return {
      festivalDays: [...days].sort(),
      eventsByDayAndStage: byKey,
    };
  }, [allEvents]);

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  if (festivalDays.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        No scheduled events yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Legend />
      {festivalDays.map((day) => (
        <div key={day} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {formatFestivalDayLabel(day)}
            <span className="ml-2 font-normal opacity-60">(6:00 AM &rarr; 6:00 AM next day)</span>
          </h2>
          <div
            className="border border-border rounded-lg overflow-auto relative"
            style={{ maxHeight: 'calc(100vh - 340px)' }}
          >
            <div
              className="flex"
              style={{ minWidth: TIME_GUTTER_WIDTH + STAGE_COLUMNS.length * STAGE_COLUMN_MIN_WIDTH }}
            >
              {/* Time gutter */}
              <div
                className="shrink-0 bg-card z-20 sticky left-0 border-r border-border"
                style={{ width: TIME_GUTTER_WIDTH }}
              >
                <div className="sticky top-0 bg-card z-30 border-b border-border" style={{ height: HEADER_HEIGHT }} />
                <div className="relative" style={{ height: TOTAL_MINUTES * PX_PER_MINUTE }}>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-2 text-xs text-muted-foreground -translate-y-1/2"
                      style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
                    >
                      {formatColumnHour(hour)}
                    </div>
                  ))}
                  {/* Midnight gridline emphasis */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/40"
                    style={{ top: (24 - DAY_START_HOUR) * HOUR_HEIGHT }}
                  />
                </div>
              </div>

              {/* Stage columns (fixed 3: Apogee, Bayou, Gallery) */}
              {STAGE_COLUMNS.map((stage) => {
                const stageEvents = eventsByDayAndStage.get(`${day}::${stage}`) || [];
                const positioned: PositionedEvent[] = stageEvents.map((ev) => {
                  const startMin = timeToColumnMinutes(ev.startTime);
                  const endMinRaw = timeToColumnMinutes(ev.endTime);
                  // endTime <= startTime in column-space means it wrapped past 30:00; clamp visually
                  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
                  return {
                    ...ev,
                    topPx: startMin * PX_PER_MINUTE,
                    heightPx: Math.max((endMin - startMin) * PX_PER_MINUTE, 24),
                  };
                });

                return (
                  <div
                    key={stage}
                    className="flex-1 border-r border-border last:border-r-0"
                    style={{ minWidth: STAGE_COLUMN_MIN_WIDTH }}
                  >
                    <div
                      className="sticky top-0 bg-card z-10 border-b border-border flex items-center justify-center font-medium text-sm"
                      style={{ height: HEADER_HEIGHT }}
                    >
                      {stage}
                    </div>

                    <div className="relative" style={{ height: TOTAL_MINUTES * PX_PER_MINUTE }}>
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 border-t border-border/50"
                          style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
                        />
                      ))}
                      <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/40"
                        style={{ top: (24 - DAY_START_HOUR) * HOUR_HEIGHT }}
                      />

                      {positioned.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedId(event.id)}
                          className={cn(
                            'absolute left-1.5 right-1.5 rounded border px-2 py-1 overflow-hidden cursor-pointer transition-opacity text-xs leading-tight hover:opacity-90',
                            BLOCK_TYPE_COLORS[event.blockType ?? 'artist_set'],
                            selectedId === event.id && 'ring-2 ring-white'
                          )}
                          style={{ top: event.topPx, height: event.heightPx }}
                          title={`${event.name}\n${event.startTime}\u2013${event.endTime}\n${event.stage}`}
                        >
                          <div className="font-medium truncate">{event.name}</div>
                          {event.heightPx > 30 && (
                            <div className="truncate opacity-70">{event.startTime}\u2013{event.endTime}</div>
                          )}
                          {event.heightPx > 50 && event.artists.length > 0 && (
                            <div className="truncate opacity-60">{event.artists.join(', ')}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const entries: Array<[string, string]> = [
    ['artist_set', 'Artist Set'],
    ['workshop', 'Workshop'],
    ['setup', 'Setup / Line Check'],
    ['special', 'Special / Notes'],
  ];
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {entries.map(([type, label]) => (
        <div key={type} className="flex items-center gap-1.5">
          <span className={cn('inline-block w-3 h-3 rounded border', BLOCK_TYPE_COLORS[type])} />
          {label}
        </div>
      ))}
    </div>
  );
}
