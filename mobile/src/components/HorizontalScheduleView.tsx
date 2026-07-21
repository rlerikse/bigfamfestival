// src/components/HorizontalScheduleView.tsx
/**
 * HorizontalScheduleView
 *
 * Shambhala-style horizontal/sideways schedule grid.
 * - Stages are rows (sticky left-hand labels).
 * - Time runs left→right along a shared horizontal axis with a sticky header ruler.
 * - Events are rendered as positioned blocks sized by duration, so overlapping
 *   sets and gaps between sets are visually obvious at a glance.
 *
 * Receives already-filtered events from ScheduleScreen (day/stage/genre/my-schedule
 * filters are applied upstream) — this component is purely a presentational
 * alternate view over the same data + interaction handlers as the vertical list.
 */
import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageRequireSource,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { ScheduleEvent } from '../types/event';
import { isEventLive } from '../utils/scheduleUtils';

// ─── Layout constants ──────────────────────────────────────────────────────
const PX_PER_MINUTE = 2.6; // horizontal density — tuned for readable set-length blocks
const ROW_HEIGHT = 92;
const STAGE_LABEL_WIDTH = 96;
const HOUR_WIDTH = 60 * PX_PER_MINUTE;
const CUTOFF_MINUTES = 6 * 60 + 30; // 6:30am — day boundary, matches ScheduleScreen logic
const GRID_START_MINUTES = CUTOFF_MINUTES; // grid starts at 6:30am
const GRID_END_MINUTES = CUTOFF_MINUTES + 24 * 60; // full 24h span from cutoff to cutoff next day

interface Props {
  events: ScheduleEvent[];
  userSchedule: Record<string, boolean>;
  onEventPress: (event: ScheduleEvent) => void;
  onToggleSchedule: (event: ScheduleEvent) => void;
  currentTime: number;
  selectedDay: string;
}

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Adjust a raw HH:MM time so times before the cutoff are treated as "next day"
// (matches the late-night event handling used by the vertical list).
function adjustedStartMinutes(time: string): number {
  const raw = timeStringToMinutes(time);
  return raw < CUTOFF_MINUTES ? raw + 24 * 60 : raw;
}

const STAGE_COLORS = [
  '#B87333', '#4C8577', '#7A5C9E', '#C2603A', '#3E7CB1', '#8C9E4C', '#B4568A',
];

function stageColor(stage: string, index: number): string {
  return STAGE_COLORS[index % STAGE_COLORS.length];
}

// Stage logo lookup — falls back to plain text label when no dedicated
// artwork exists for a stage (keeps this future-proof for new/temp stages).
function stageLogoSource(stage: string): ImageRequireSource | null {
  const normalized = stage.trim().toLowerCase();
  if (normalized === 'apogee') return require('../assets/images/apogee-logo-trans.png');
  if (normalized === 'bayou') return require('../assets/images/bayou-logo-trans.png');
  if (normalized === 'the gallery' || normalized === 'gallery') return require('../assets/images/the-gallery-logo-trans.png');
  return null;
}

const HorizontalScheduleView: React.FC<Props> = ({
  events,
  userSchedule,
  onEventPress,
  onToggleSchedule,
  currentTime,
  selectedDay,
}) => {
  const verticalScrollRef = useRef<ScrollView>(null);
  const headerScrollRef = useRef<ScrollView>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  // Guards against the two horizontal ScrollViews (header ruler + body) fighting
  // over sync-scroll events and causing jitter.
  const isSyncingScroll = useRef(false);
  const previousDayRef = useRef<string | null>(null);

  const stages = useMemo(() => {
    const set = new Set<string>();
    events.forEach(ev => {
      if (ev.stage && ev.stage.trim()) set.add(ev.stage);
    });
    return Array.from(set).sort();
  }, [events]);

  const eventsByStage = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    stages.forEach(stage => map.set(stage, []));
    events.forEach(ev => {
      if (!ev.stage) return;
      const list = map.get(ev.stage);
      if (list) list.push(ev);
    });
    return map;
  }, [events, stages]);

  const totalGridMinutes = GRID_END_MINUTES - GRID_START_MINUTES;
  const gridWidth = totalGridMinutes * PX_PER_MINUTE;

  // Hour markers for the time ruler header.
  const hourMarkers = useMemo(() => {
    const markers: { label: string; offset: number }[] = [];
    for (let m = GRID_START_MINUTES; m <= GRID_END_MINUTES; m += 60) {
      const hourOfDay = Math.floor((m % (24 * 60)) / 60);
      const suffix = hourOfDay === 0 ? '12A' : hourOfDay === 12 ? '12P' : hourOfDay > 12 ? `${hourOfDay - 12}P` : `${hourOfDay}A`;
      markers.push({ label: suffix, offset: (m - GRID_START_MINUTES) * PX_PER_MINUTE });
    }
    return markers;
  }, []);

  // "Now" indicator line — only shown when viewing today.
  const nowOffset = useMemo(() => {
    if (!selectedDay) return null;
    const now = new Date(currentTime);
    const nowDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMinutesRaw = now.getHours() * 60 + now.getMinutes();
    const nowMinutesAdjusted = nowMinutesRaw < CUTOFF_MINUTES ? nowMinutesRaw + 24 * 60 : nowMinutesRaw;

    // "Today" for this grid means either selectedDay matches nowDateStr (and it's
    // after the cutoff), or selectedDay is "yesterday" and it's currently before
    // the cutoff (i.e. we're in the late-night portion of yesterday's grid).
    const isSameCalendarDay = nowDateStr === selectedDay && nowMinutesRaw >= CUTOFF_MINUTES;
    if (!isSameCalendarDay) return null;

    return (nowMinutesAdjusted - GRID_START_MINUTES) * PX_PER_MINUTE;
  }, [currentTime, selectedDay]);

  // Keep the time-ruler header in lockstep with the body's horizontal scroll,
  // and vice versa, without feedback loops.
  const handleBodyScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    isSyncingScroll.current = true;
    headerScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  }, []);

  const handleHeaderScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    isSyncingScroll.current = true;
    bodyScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  }, []);

  // On day change, auto-scroll horizontally to the live "now" position if the day
  // is in progress, otherwise to the first event of the day — mirrors the vertical
  // list's behavior (reuses the same isEventLive helper from scheduleUtils, not
  // reimplemented here).
  useEffect(() => {
    if (!selectedDay) return;
    if (previousDayRef.current && previousDayRef.current !== selectedDay) {
      setTimeout(() => {
        const nowMs = currentTime;
        const liveEvent = events.find(ev => ev.stage && isEventLive(ev, nowMs));
        let targetMin: number | null = null;
        if (liveEvent) {
          targetMin = adjustedStartMinutes(liveEvent.startTime);
        } else {
          // Day hasn't started (or is over) — scroll to the earliest event of the day.
          const sorted = [...events]
            .filter(ev => ev.stage && ev.startTime)
            .sort((a, b) => adjustedStartMinutes(a.startTime) - adjustedStartMinutes(b.startTime));
          if (sorted.length > 0) targetMin = adjustedStartMinutes(sorted[0].startTime);
        }
        if (targetMin !== null) {
          const targetX = Math.max((targetMin - GRID_START_MINUTES) * PX_PER_MINUTE - 40, 0);
          bodyScrollRef.current?.scrollTo({ x: targetX, animated: true });
          headerScrollRef.current?.scrollTo({ x: targetX, animated: true });
        }
      }, 0);
    }
    previousDayRef.current = selectedDay;
  }, [selectedDay, events, currentTime]);

  if (stages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color="#B87333" />
        <Text style={styles.emptyText}>No events found for the selected filters.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky time ruler header */}
      <View style={styles.headerRow}>
        <View style={[styles.stageLabelCell, styles.headerCorner]} />
        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleHeaderScroll}
          scrollEventThrottle={16}
          bounces={false}
        >
          <View style={{ width: gridWidth, height: 36 }}>
            {hourMarkers.map((marker, idx) => (
              <View key={idx} style={[styles.hourMarker, { left: marker.offset }]}>
                <Text style={styles.hourMarkerText}>{marker.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Body: sticky stage labels (left) + horizontally scrollable event grid */}
      <ScrollView
        ref={verticalScrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.bodyVerticalScroll}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* Sticky stage label column */}
          <View style={styles.stageLabelColumn}>
            {stages.map((stage, idx) => {
              const logoSource = stageLogoSource(stage);
              return (
                <View key={stage} style={[styles.stageLabelCell, { height: ROW_HEIGHT, borderLeftColor: stageColor(stage, idx), borderLeftWidth: 4 }]}>
                  {logoSource ? (
                    <ExpoImage
                      source={logoSource}
                      style={styles.stageLabelLogo}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Text style={styles.stageLabelText} numberOfLines={2}>{stage.replace(/^The /i, '')}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Horizontally scrollable grid of event blocks, one row per stage */}
          <ScrollView
            ref={bodyScrollRef}
            horizontal
            showsHorizontalScrollIndicator
            onScroll={handleBodyScroll}
            scrollEventThrottle={16}
            bounces={false}
          >
            <View style={{ width: gridWidth }}>
              {/* "Now" indicator line */}
              {nowOffset !== null && nowOffset >= 0 && nowOffset <= gridWidth && (
                <View style={[styles.nowLine, { left: nowOffset, height: ROW_HEIGHT * stages.length }]} />
              )}
              {stages.map((stage, rowIdx) => {
                const stageEvents = eventsByStage.get(stage) || [];
                return (
                  <View key={stage} style={[styles.stageRow, { height: ROW_HEIGHT }]}>
                    {/* Hour gridlines for this row */}
                    {hourMarkers.map((marker, idx) => (
                      <View key={idx} style={[styles.gridLine, { left: marker.offset }]} />
                    ))}
                    {stageEvents.map(ev => {
                      const startMin = adjustedStartMinutes(ev.startTime);
                      let endMin = ev.endTime && ev.endTime.trim()
                        ? adjustedStartMinutes(ev.endTime)
                        : startMin + 60;
                      if (endMin <= startMin) endMin += 24 * 60; // crosses midnight
                      const left = (startMin - GRID_START_MINUTES) * PX_PER_MINUTE;
                      const width = Math.max((endMin - startMin) * PX_PER_MINUTE, 44);
                      const isInSchedule = Boolean(userSchedule[ev.id]);
                      return (
                        <TouchableOpacity
                          key={ev.id}
                          style={[
                            styles.eventBlock,
                            {
                              left,
                              width,
                              borderLeftColor: stageColor(stage, rowIdx),
                              borderLeftWidth: 4,
                              borderColor: isInSchedule ? '#B87333' : 'rgba(255, 255, 255, 0.2)',
                              borderWidth: isInSchedule ? 2 : 1,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => onEventPress(ev)}
                          onLongPress={() => onToggleSchedule(ev)}
                          accessibilityLabel={`${ev.name}, ${ev.startTime} on ${stage}`}
                        >
                          <Text style={styles.eventBlockTitle} numberOfLines={2}>{ev.name}</Text>
                          <Text style={styles.eventBlockTime} numberOfLines={1}>{ev.startTime}</Text>
                          {isInSchedule && (
                            <Ionicons name="heart" size={12} color="#B87333" style={styles.eventBlockHeart} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    height: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  headerCorner: {
    height: 36,
    backgroundColor: 'transparent',
  },
  hourMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hourMarkerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  bodyVerticalScroll: {
    flex: 1,
  },
  stageLabelColumn: {
    width: STAGE_LABEL_WIDTH,
  },
  stageLabelCell: {
    width: STAGE_LABEL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  stageLabelLogo: {
    width: STAGE_LABEL_WIDTH - 16,
    height: ROW_HEIGHT - 24,
  },
  stageLabelText: {
    color: '#F5F5DC',
    fontSize: 12,
    fontWeight: '700',
  },
  stageRow: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    backgroundColor: '#E23F44',
    zIndex: 10,
  },
  eventBlock: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: 12,
    padding: 6,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  eventBlockTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventBlockTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
  eventBlockHeart: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16,
    color: '#fff',
  },
});

export default HorizontalScheduleView;
