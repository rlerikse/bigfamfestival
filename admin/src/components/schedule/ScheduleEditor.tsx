import { useEffect, useMemo, useRef, useState } from 'react';
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
  SLOT_MINUTES,
  BLOCK_TYPE_COLORS,
  formatColumnHour,
  formatFestivalDayLabel,
  timeToColumnMinutes,
  columnMinutesToTime,
  columnMinutesToRealDate,
  snapToSlot,
} from '@/lib/scheduleGrid';

interface Props {
  /** Injectable for future real-data wiring; defaults to mocked events for #169 dev. */
  events?: Event[];
  /** Called after a successful move/resize; mirrors the future partial-update API contract. */
  onUpdateEvent?: (id: string, patch: Partial<Event>) => Promise<void> | void;
  /** Server-side overlap check stub — replaced by real API validation once #167/#168 land. */
  checkOverlap?: (candidate: Event, allEvents: Event[]) => Event | null;
}

interface PositionedEvent extends Event {
  topPx: number;
  heightPx: number;
}

const HOUR_HEIGHT = 60 * PX_PER_MINUTE;
const MIN_BLOCK_MINUTES = SLOT_MINUTES;

type DragMode = 'move' | 'resize';

interface ActiveDrag {
  mode: DragMode;
  eventId: string;
  pointerStartY: number;
  pointerStartX: number;
  origTopMin: number; // column-minutes, relative to 06:00
  origDurationMin: number;
  origStage: string;
  festivalDay: string;
  stageOrder: string[]; // STAGE_COLUMNS, for left/right stage-switch on move
  columnHeightPx: number;
}

interface DragPreview {
  eventId: string;
  topMin: number;
  durationMin: number;
  stage: string;
}

/** Naive client-side overlap check against sibling events on same stage+festivalDay. Placeholder for server validation (#167/#168). */
function defaultCheckOverlap(candidate: Event, allEvents: Event[]): Event | null {
  const candStart = timeToColumnMinutes(candidate.startTime);
  let candEnd = timeToColumnMinutes(candidate.endTime);
  if (candEnd <= candStart) candEnd += 24 * 60;

  for (const ev of allEvents) {
    if (ev.id === candidate.id) continue;
    if (ev.stage !== candidate.stage) continue;
    if ((ev.festivalDay ?? ev.date) !== (candidate.festivalDay ?? candidate.date)) continue;
    const evStart = timeToColumnMinutes(ev.startTime);
    let evEnd = timeToColumnMinutes(ev.endTime);
    if (evEnd <= evStart) evEnd += 24 * 60;
    if (candStart < evEnd && evStart < candEnd) return ev;
  }
  return null;
}

export function ScheduleEditor({ events, onUpdateEvent, checkOverlap = defaultCheckOverlap }: Props) {
  const [localEvents, setLocalEvents] = useState<Event[]>(events ?? mockScheduleEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const dragRef = useRef<ActiveDrag | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync local working copy whenever the upstream `events` prop changes
  // (e.g. real API data arriving after initial mount, or a refetch after a
  // successful move/resize). Skipped while a drag is actively in-flight so we
  // don't yank a block out from under the user's pointer mid-drag.
  useEffect(() => {
    if (events && !dragRef.current) {
      setLocalEvents(events);
    }
  }, [events]);

  const showError = (msg: string) => {
    setErrorBanner(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorBanner(null), 5000);
  };

  // Group events by festivalDay (data-driven: supports N days without code changes).
  const { festivalDays, eventsByDayAndStage } = useMemo(() => {
    const days = new Set<string>();
    const byKey = new Map<string, Event[]>();

    for (const ev of localEvents) {
      // Skip events missing the fields required to place them on the grid
      // (e.g. artist-metadata-only records without stage/date/time, seen from
      // real API data that predates the schedule fields).
      if (!ev.stage || !ev.startTime || !ev.endTime || !(ev.festivalDay ?? ev.date)) continue;
      const day = ev.festivalDay ?? ev.date;
      days.add(day);
      const key = `${day}::${ev.stage}`;
      const existing = byKey.get(key) || [];
      existing.push(ev);
      byKey.set(key, existing);
    }

    return { festivalDays: [...days].sort(), eventsByDayAndStage: byKey };
  }, [localEvents]);

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  function commitEventUpdate(id: string, patch: Partial<Event>) {
    const prevEvents = localEvents;
    const target = localEvents.find((e) => e.id === id);
    if (!target) return;

    const candidate: Event = { ...target, ...patch };
    const conflict = checkOverlap(candidate, localEvents);
    if (conflict) {
      showError(`Conflicts with "${conflict.name}" ${conflict.startTime}\u2013${conflict.endTime}`);
      return; // rollback: never applied, block snaps back (state untouched)
    }

    // Optimistic update
    setLocalEvents((prev) => prev.map((e) => (e.id === id ? candidate : e)));

    Promise.resolve(onUpdateEvent?.(id, patch)).catch((err: unknown) => {
      // Rollback on API rejection (e.g. server-side overlap validation from #167)
      setLocalEvents(prevEvents);
      const message = err instanceof Error && err.message ? err.message : `Failed to save changes to "${target.name}" — reverted.`;
      showError(message);
    });
  }

  function startDrag(
    mode: DragMode,
    event: Event,
    clientX: number,
    clientY: number,
    columnHeightPx: number
  ) {
    const startMin = timeToColumnMinutes(event.startTime);
    let endMin = timeToColumnMinutes(event.endTime);
    if (endMin <= startMin) endMin += 24 * 60;
    const durationMin = endMin - startMin;

    dragRef.current = {
      mode,
      eventId: event.id,
      pointerStartY: clientY,
      pointerStartX: clientX,
      origTopMin: startMin,
      origDurationMin: durationMin,
      origStage: event.stage,
      festivalDay: event.festivalDay ?? event.date,
      stageOrder: [...STAGE_COLUMNS],
      columnHeightPx,
    };
    setDragPreview({ eventId: event.id, topMin: startMin, durationMin, stage: event.stage });
    setSelectedId(event.id);

    const handlePointerMove = (moveEvent: PointerEvent) => onDragMove(moveEvent);
    const handlePointerUp = (upEvent: PointerEvent) => {
      onDragEnd(upEvent);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function onDragMove(moveEvent: PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaYPx = moveEvent.clientY - drag.pointerStartY;
    const deltaMinRaw = deltaYPx / PX_PER_MINUTE;

    if (drag.mode === 'move') {
      const deltaXPx = moveEvent.clientX - drag.pointerStartX;
      const stageWidth = STAGE_COLUMN_MIN_WIDTH; // approximation for stage-switch threshold
      const stageShift = Math.round(deltaXPx / stageWidth);
      const origIndex = drag.stageOrder.indexOf(drag.origStage);
      const newIndex = Math.min(drag.stageOrder.length - 1, Math.max(0, origIndex + stageShift));
      const newStage = drag.stageOrder[newIndex];

      let newTopMin = snapToSlot(drag.origTopMin + deltaMinRaw);
      newTopMin = Math.max(0, Math.min(newTopMin, TOTAL_MINUTES - drag.origDurationMin));

      setDragPreview({ eventId: drag.eventId, topMin: newTopMin, durationMin: drag.origDurationMin, stage: newStage });
    } else {
      let newDuration = snapToSlot(drag.origDurationMin + deltaMinRaw);
      newDuration = Math.max(MIN_BLOCK_MINUTES, Math.min(newDuration, TOTAL_MINUTES - drag.origTopMin));
      setDragPreview({ eventId: drag.eventId, topMin: drag.origTopMin, durationMin: newDuration, stage: drag.origStage });
    }
  }

  function onDragEnd(_upEvent: PointerEvent) {
    const drag = dragRef.current;
    const preview = dragPreview;
    dragRef.current = null;
    if (!drag || !preview) {
      setDragPreview(null);
      return;
    }

    const target = localEvents.find((e) => e.id === drag.eventId);
    setDragPreview(null);
    if (!target) return;

    if (drag.mode === 'move') {
      const noOp = preview.topMin === drag.origTopMin && preview.stage === drag.origStage;
      if (noOp) return;
      const newStartTime = columnMinutesToTime(preview.topMin);
      const newEndTime = columnMinutesToTime(preview.topMin + preview.durationMin);
      const newDate = columnMinutesToRealDate(drag.festivalDay, preview.topMin);
      commitEventUpdate(drag.eventId, {
        stage: preview.stage,
        startTime: newStartTime,
        endTime: newEndTime,
        date: newDate,
        festivalDay: drag.festivalDay,
      });
    } else {
      if (preview.durationMin === drag.origDurationMin) return;
      const newEndTime = columnMinutesToTime(preview.topMin + preview.durationMin);
      commitEventUpdate(drag.eventId, { endTime: newEndTime });
    }
  }

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

      {errorBanner && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 text-red-200 text-sm px-3 py-2">
          {errorBanner}
        </div>
      )}

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
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/40"
                    style={{ top: (24 - DAY_START_HOUR) * HOUR_HEIGHT }}
                  />
                </div>
              </div>

              {/* Stage columns (fixed 3: Apogee, Bayou, Gallery) */}
              {STAGE_COLUMNS.map((stage) => {
                const stageEvents = (eventsByDayAndStage.get(`${day}::${stage}`) || []).filter(
                  (ev) => !(dragPreview && dragPreview.eventId === ev.id && dragPreview.stage !== stage)
                );

                const positioned: PositionedEvent[] = stageEvents.map((ev) => {
                  const isDraggingThis = dragPreview?.eventId === ev.id;
                  if (isDraggingThis && dragPreview) {
                    return {
                      ...ev,
                      topPx: dragPreview.topMin * PX_PER_MINUTE,
                      heightPx: Math.max(dragPreview.durationMin * PX_PER_MINUTE, 24),
                    };
                  }
                  const startMin = timeToColumnMinutes(ev.startTime);
                  const endMinRaw = timeToColumnMinutes(ev.endTime);
                  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
                  return {
                    ...ev,
                    topPx: startMin * PX_PER_MINUTE,
                    heightPx: Math.max((endMin - startMin) * PX_PER_MINUTE, 24),
                  };
                });

                const columnHeightPx = TOTAL_MINUTES * PX_PER_MINUTE;

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

                    <div className="relative" style={{ height: columnHeightPx }}>
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

                      {positioned.map((event) => {
                        const isDragging = dragPreview?.eventId === event.id;
                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedId(event.id)}
                            onPointerDown={(e) => {
                              if ((e.target as HTMLElement).dataset.resizeHandle) return;
                              e.preventDefault();
                              startDrag('move', event, e.clientX, e.clientY, columnHeightPx);
                            }}
                            className={cn(
                              'absolute left-1.5 right-1.5 rounded border px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing transition-opacity text-xs leading-tight hover:opacity-90 select-none touch-none',
                              BLOCK_TYPE_COLORS[event.blockType ?? 'artist_set'],
                              selectedId === event.id && 'ring-2 ring-white',
                              isDragging && 'opacity-80 shadow-lg z-30'
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

                            {/* Resize handle: bottom edge, 15-min duration change (#171) */}
                            <div
                              data-resize-handle="true"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startDrag('resize', event, e.clientX, e.clientY, columnHeightPx);
                              }}
                              className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize touch-none hover:bg-white/30"
                            />
                          </div>
                        );
                      })}
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
