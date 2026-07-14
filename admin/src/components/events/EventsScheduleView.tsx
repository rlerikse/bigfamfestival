import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/useApi';
import type { Event } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  search: string;
  stage: string;
}

// Constants
const PX_PER_MINUTE = 1; // 1px per minute = 60px per hour
const HOUR_HEIGHT = 60;
const TIME_GUTTER_WIDTH = 60;
const DAY_COLUMN_MIN_WIDTH = 200;
const HEADER_HEIGHT = 44;
const START_HOUR = 8; // 8 AM
const END_HOUR = 25;  // 1 AM next day (25 = "25:00")
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

// Stage color map
const STAGE_COLORS: Record<string, string> = {
  'Main Stage': 'bg-blue-100 border-blue-400 text-blue-900',
  'Second Stage': 'bg-purple-100 border-purple-400 text-purple-900',
  'DJ Tent': 'bg-green-100 border-green-400 text-green-900',
  'Acoustic Corner': 'bg-amber-100 border-amber-400 text-amber-900',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  // Handle next-day times (e.g., 01:00 becomes 25:00 equivalent)
  const adjustedH = h < START_HOUR ? h + 24 : h;
  return (adjustedH - START_HOUR) * 60 + m;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

interface LanedEvent extends Event {
  lane: number;
  topPx: number;
  heightPx: number;
}

// Lane-packing algorithm for overlapping events within a day
function packLanes(events: Event[]): LanedEvent[] {
  const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const lanes: { endMin: number }[] = [];
  const result: LanedEvent[] = [];

  for (const event of sorted) {
    const startMin = timeToMinutes(event.startTime);
    const endMin = timeToMinutes(event.endTime);
    const topPx = startMin * PX_PER_MINUTE;
    const heightPx = Math.max((endMin - startMin) * PX_PER_MINUTE, 20); // min 20px

    // Find first lane where event fits
    let assignedLane = -1;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].endMin <= startMin) {
        assignedLane = i;
        lanes[i].endMin = endMin;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push({ endMin });
    }

    result.push({ ...event, lane: assignedLane, topPx, heightPx });
  }

  return result;
}

export function EventsScheduleView({ search, stage }: Props) {
  // Fetch all events from API
  const { data: rawData } = useApiQuery<unknown>(
    ['events-schedule', search, stage],
    '/events',
    { search, stage }
  );

  // Normalize: API may return array directly or { data: [...] } or { events: [...] }
  const allEvents: Event[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    const obj = rawData as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Event[];
    if (Array.isArray(obj.events)) return obj.events as Event[];
    // Find first array value
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as Event[];
    }
    return [];
  }, [rawData]);

  // Group events by date
  const { days, eventsByDay } = useMemo(() => {
    const filtered = allEvents.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (stage && e.stage !== stage) return false;
      return true;
    });

    const byDay = new Map<string, Event[]>();
    for (const ev of filtered) {
      const existing = byDay.get(ev.date) || [];
      existing.push(ev);
      byDay.set(ev.date, existing);
    }

    const sortedDays = [...byDay.keys()].sort();
    return { days: sortedDays, eventsByDay: byDay };
  }, [search, stage]);

  // Get current time position
  const now = new Date();
  const nowMinutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const showCurrentLine = nowMinutes >= 0 && nowMinutes <= TOTAL_MINUTES;

  // Generate hour labels
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="border border-border rounded-lg overflow-auto relative" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      <div className="flex" style={{ minWidth: TIME_GUTTER_WIDTH + days.length * DAY_COLUMN_MIN_WIDTH }}>
        {/* Time gutter (sticky left) */}
        <div
          className="shrink-0 bg-card z-20 sticky left-0 border-r border-border"
          style={{ width: TIME_GUTTER_WIDTH }}
        >
          {/* Corner spacer */}
          <div className="sticky top-0 bg-card z-30 border-b border-border" style={{ height: HEADER_HEIGHT }} />

          {/* Hour labels */}
          <div className="relative" style={{ height: TOTAL_MINUTES * PX_PER_MINUTE }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-xs text-muted-foreground -translate-y-1/2"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {days.map((date) => {
          const dayEvents = eventsByDay.get(date) || [];
          const lanedEvents = packLanes(dayEvents);
          const maxLane = lanedEvents.reduce((max, e) => Math.max(max, e.lane), 0);
          const laneCount = maxLane + 1;
          const laneWidth = Math.max(40, (DAY_COLUMN_MIN_WIDTH - 16) / laneCount);

          return (
            <div key={date} className="flex-1 border-r border-border last:border-r-0" style={{ minWidth: DAY_COLUMN_MIN_WIDTH }}>
              {/* Day header (sticky top) */}
              <div
                className="sticky top-0 bg-card z-10 border-b border-border flex items-center justify-center font-medium text-sm"
                style={{ height: HEADER_HEIGHT }}
              >
                {formatDate(date)}
              </div>

              {/* Time grid */}
              <div className="relative" style={{ height: TOTAL_MINUTES * PX_PER_MINUTE }}>
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time line */}
                {showCurrentLine && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                    style={{ top: nowMinutes * PX_PER_MINUTE }}
                  >
                    <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Event blocks */}
                {lanedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'absolute rounded border px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity text-xs leading-tight',
                      STAGE_COLORS[event.stage] || 'bg-gray-100 border-gray-400 text-gray-900'
                    )}
                    style={{
                      top: event.topPx,
                      height: event.heightPx,
                      left: 8 + event.lane * laneWidth,
                      width: laneWidth - 4,
                    }}
                    title={`${event.name}\n${event.startTime}–${event.endTime}\n${event.stage}`}
                  >
                    <div className="font-medium truncate">{event.name}</div>
                    {event.heightPx > 30 && (
                      <div className="truncate opacity-70">{event.startTime}–{event.endTime}</div>
                    )}
                    {event.heightPx > 50 && (
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
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
