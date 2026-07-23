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
import React, { useMemo, useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageRequireSource,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import OptimizedImage from './OptimizedImage';
import { ScheduleEvent } from '../types/event';
import { isEventLive, resolveScheduleDayScrollTarget } from '../utils/scheduleUtils';

// ─── Layout constants ──────────────────────────────────────────────────────
// Zoomed out so ~3 hours reads comfortably across the viewport (was 2.6 =
// ~1 hour visible). Lower density → wider time span left→right per screen.
const PX_PER_MINUTE = 6.0; // zoomed in — final shipping value; Android gets a touch more breathing room than 6.5
const ROW_HEIGHT = 108; // taller rows so the full-height photo has room to breathe
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
  // Last horizontal scroll offset (px) from a previous mount of this view, lifted
  // up to the parent (ScheduleScreen) since this component unmounts entirely when
  // the user toggles back to list view. When present, restores that exact scroll
  // position on (re)mount instead of the "next upcoming / last event" default.
  initialScrollX?: number | null;
  // Fired (throttled by scrollEventThrottle) as the body grid scrolls, so the
  // parent can remember the latest offset for the next time this view mounts.
  onScrollPositionChange?: (x: number) => void;
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

// Minimum block width (px) below which the full-height photo is hidden to avoid
// squishing short-set blocks into an unreadable sliver.
const MIN_WIDTH_FOR_THUMBNAIL = 70;

function formatTimeUntil(ev: ScheduleEvent, currentTime: number): string {
  if (!ev.date || !ev.startTime) return '';
  const startTs = new Date(`${ev.date}T${ev.startTime}`).getTime();
  const diff = startTs - currentTime;
  if (diff <= 0) return '';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) {
    const mins = Math.ceil(diff / minute);
    return `${mins}m`;
  }
  if (diff < day) {
    const hrs = Math.floor(diff / hour);
    const mins = Math.ceil((diff % hour) / minute);
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  const days = Math.floor(diff / day);
  const hrs = Math.floor((diff % day) / hour);
  return `${days}d${hrs > 0 ? ` ${hrs}h` : ''}`;
}

const HorizontalScheduleView: React.FC<Props> = ({
  events,
  userSchedule,
  onEventPress,
  onToggleSchedule,
  currentTime,
  selectedDay,
  initialScrollX,
  onScrollPositionChange,
}) => {
  const verticalScrollRef = useRef<ScrollView>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  const previousDayRef = useRef<string | null>(null);
  // Pending horizontal auto-scroll target (px) queued on day change, consumed
  // once the remounted body ScrollView lays out its content (onContentSizeChange).
  const pendingScrollXRef = useRef<number | null>(null);
  const pendingRafRef = useRef<number | null>(null);
  // Header-ruler sync, driven entirely on the native/UI thread.
  //
  // Previously the header ruler was its own horizontal ScrollView, kept in sync
  // with the body grid via onScroll handlers that called the *other* view's
  // imperative scrollTo() on the JS thread. Every scroll frame round-tripped
  // JS -> bridge -> native -> JS -> bridge -> native, which is fine on iOS but
  // visibly laggy on Android (dropped frames / rubber-banding while dragging).
  //
  // Fix: the header ruler is now a plain (non-scrollable) Animated.View whose
  // horizontal translateX is bound to a native Animated.Value that's driven
  // directly off the body ScrollView's onScroll via Animated.event({ useNativeDriver:
  // true }). That wiring runs entirely on the native/UI thread -- no JS round
  // trip, no bridge traffic per frame, no isSyncingScroll feedback-loop guard
  // needed at all (there's only one source of truth now: the body scroll
  // position), which removes the historical race entirely rather than papering
  // over it.
  const scrollX = useRef(new Animated.Value(0)).current;
  const handleBodyScrollNative = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          useNativeDriver: true,
          // Also mirrors the latest offset into a plain ref (JS thread, throttled
          // by scrollEventThrottle) purely for the filter-change re-clamp check
          // below -- this does NOT gate the header-sync animation itself, which
          // stays 100% native-driven.
          listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
            currentOffsetRef.current.x = e.nativeEvent.contentOffset.x;
            onScrollPositionChange?.(e.nativeEvent.contentOffset.x);
          },
        }
      ),
    [scrollX, onScrollPositionChange]
  );
  // Consume a pending auto-scroll target (declared before the day-change effects
  // that reference it). scrollX (and therefore the header ruler) follows the
  // body ScrollView automatically once it moves -- no separate header scrollTo
  // needed.
  const applyPendingScrollImpl = () => {
    const x = pendingScrollXRef.current;
    if (x == null) return;
    pendingScrollXRef.current = null;
    bodyScrollRef.current?.scrollTo({ x, animated: true });
  };
  const applyPendingScroll = useCallback(applyPendingScrollImpl, []);
  // Tracks the last known scroll offsets so a filter change (Stage/Genre) can
  // re-clamp to a valid position instead of relying on the native ScrollView to
  // do it implicitly (see currentOffsetRef usage below for why this matters).
  const currentOffsetRef = useRef({ x: 0, y: 0 });

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
      const ampm = hourOfDay >= 12 ? 'PM' : 'AM';
      const hour12 = hourOfDay % 12 || 12;
      const suffix = `${hour12} ${ampm}`;
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

  // On Stage/Genre filter changes, `events` gets a new (shorter/reshaped) array
  // from ScheduleScreen while `selectedDay` stays the same. That shrinks the
  // vertical content height (fewer stage rows) without changing the horizontal
  // grid width (grid always spans the full day). Android's ScrollView clamps an
  // out-of-range contentOffset back into bounds automatically when content
  // shrinks; iOS's UIScrollView does NOT — it keeps the stale contentOffset, so
  // after a filter tap the visible rows on iOS correspond to the *previous*
  // scroll position mapped onto the *new* (shorter) content, landing on the
  // wrong stage/section, while Android "just works".
  //
  // Previous approach (fixed in PR #152) called scrollTo({x:0,y:0}) imperatively
  // inside a requestAnimationFrame. That worked most of the time but was a race:
  // if the user's finger was still on the ScrollView, or iOS momentum/deceleration
  // was still in flight when the filter landed, the imperative scrollTo could be
  // stomped by the in-progress native scroll animation completing a frame later —
  // "works a few times then random", exactly as reported. Imperative scrollTo
  // calls race arbitrary native scroll/gesture state; there's no way to guarantee
  // ordering against it.
  //
  // Fix: force a full remount of the three ScrollViews on a genuine filter change
  // (via `key`), rather than nudging an existing one. A freshly-mounted
  // ScrollView always starts at offset {0,0} — there's no stale native scroll
  // state left to race against, because the old native scroll view instance is
  // torn down. bumping `scrollResetKey` in useLayoutEffect (synchronous, before
  // paint) rather than useEffect+rAF also removes the extra frame of delay where
  // the old (stale-offset) content could still be visible/interactive.
  const [scrollResetKey, setScrollResetKey] = useState(0);
  const previousEventsRef = useRef<ScheduleEvent[] | null>(null);
  useLayoutEffect(() => {
    const isDayChange = previousDayRef.current !== null && previousDayRef.current !== selectedDay;
    const isFirstRun = previousEventsRef.current === null;
    if (!isDayChange && !isFirstRun && previousEventsRef.current !== events) {
      currentOffsetRef.current = { x: 0, y: 0 };
      setScrollResetKey(k => k + 1);
    }
    previousEventsRef.current = events;
  }, [events, selectedDay]);


  // On day change, auto-scroll horizontally per resolveScheduleDayScrollTarget:
  // to the live "now" position if the day is in progress, to the LAST event if
  // the day is fully over, or to the FIRST event if the day hasn't started yet —
  // mirrors the vertical list's behavior (reuses the same shared helper from
  // scheduleUtils, not reimplemented here).
  //
  // ROBUSTNESS (iOS "breaks after ~4 switches"): a day change ALSO bumps
  // scrollResetKey, which REMOUNTS the three ScrollViews. A fire-and-forget
  // setTimeout(scrollTo) here raced that remount — it would grab a torn-down or
  // not-yet-laid-out ScrollView ref and silently no-op after a few rapid
  // switches. Instead we COMPUTE the target and stash it in pendingScrollXRef;
  // the freshly-mounted body ScrollView performs the scroll from its
  // onContentSizeChange (fires once its content is laid out and actually
  // scrollable). No timing guess, no ref race.
  // Shared "where should the grid land" resolver — live event position, else
  // first/last event of the day per resolveScheduleDayScrollTarget. Used both on
  // day-change and as the mount-time fallback when there's no saved scroll offset
  // to restore.
  const computeDefaultScrollX = useCallback((nowMs: number): number | null => {
    const stageEvents = events.filter(ev => ev.stage && ev.startTime);
    const target = resolveScheduleDayScrollTarget(stageEvents, nowMs);
    let targetMin: number | null = null;
    if (target === 'live') {
      const liveEvent = stageEvents.find(ev => isEventLive(ev, nowMs));
      if (liveEvent) targetMin = adjustedStartMinutes(liveEvent.startTime);
    } else if (target === 'first' || target === 'last') {
      const sorted = [...stageEvents].sort((a, b) => adjustedStartMinutes(a.startTime) - adjustedStartMinutes(b.startTime));
      if (sorted.length > 0) {
        const targetEvent = target === 'first' ? sorted[0] : sorted[sorted.length - 1];
        targetMin = adjustedStartMinutes(targetEvent.startTime);
      }
    }
    if (targetMin === null) return null;
    return Math.max((targetMin - GRID_START_MINUTES) * PX_PER_MINUTE - 40, 0);
  }, [events]);

  useEffect(() => {
    if (!selectedDay) return;
    if (previousDayRef.current && previousDayRef.current !== selectedDay) {
      pendingScrollXRef.current = computeDefaultScrollX(currentTime);
    }
    previousDayRef.current = selectedDay;
  }, [selectedDay, computeDefaultScrollX, currentTime]);

  // On (re)mount — e.g. the user toggled from list view back to grid view — restore
  // the last horizontal scroll position if one was handed down from the parent
  // (ScheduleScreen keeps it alive across unmounts of this component). Otherwise
  // fall back to the same "next upcoming event, or last if the day's over" default
  // used on a day switch. Runs once per mount only (empty dep array — a later day
  // change is handled by the effect above, not this one).
  useEffect(() => {
    pendingScrollXRef.current = initialScrollX != null
      ? initialScrollX
      : computeDefaultScrollX(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback consumer: if the body ScrollView's content size does NOT change on
  // a day switch (e.g. the new day happens to have identical layout dimensions),
  // onContentSizeChange won't fire — so also flush any pending scroll on the next
  // frame after selectedDay settles. Double-flush is harmless (target is nulled
  // after the first consumer runs). rAF is cleaned up to avoid stacking.
  useEffect(() => {
    if (pendingScrollXRef.current == null) return;
    const raf = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(applyPendingScroll);
      pendingRafRef.current = raf2;
    });
    return () => {
      cancelAnimationFrame(raf);
      if (pendingRafRef.current != null) cancelAnimationFrame(pendingRafRef.current);
    };
  }, [selectedDay, applyPendingScroll]);

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
        <View style={styles.headerRulerViewport}>
          <Animated.View
            style={{
              width: gridWidth,
              height: 36,
              transform: [{ translateX: Animated.multiply(scrollX, -1) }],
            }}
          >
            {hourMarkers.map((marker, idx) => (
              <View key={idx} style={[styles.hourMarker, { left: marker.offset }]}>
                <Text style={styles.hourMarkerText}>{marker.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      {/* Body: sticky stage labels (left) + horizontally scrollable event grid */}
      <ScrollView
        ref={verticalScrollRef}
        key={`vertical-${scrollResetKey}`}
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
          <Animated.ScrollView
            ref={bodyScrollRef}
            key={`body-${scrollResetKey}`}
            horizontal
            showsHorizontalScrollIndicator
            onScroll={handleBodyScrollNative}
            onContentSizeChange={applyPendingScroll}
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
                      const timeUntil = formatTimeUntil(ev, currentTime);
                      const showThumbnail = width >= MIN_WIDTH_FOR_THUMBNAIL;
                      // Mirror the vertical card's live/finished status.
                      const startTs = ev.date && ev.startTime ? new Date(`${ev.date}T${ev.startTime}`).getTime() : 0;
                      let endTs = ev.date && ev.endTime && ev.endTime.trim()
                        ? new Date(`${ev.date}T${ev.endTime}`).getTime()
                        : startTs + 2 * 60 * 60 * 1000;
                      if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000;
                      const isLive = startTs > 0 && currentTime >= startTs && currentTime < endTs;
                      const isPast = startTs > 0 && currentTime >= endTs;
                      const genreLine = ev.genres && ev.genres.length > 0 ? ev.genres.join(' • ') : '';
                      const fmt12 = (t?: string) => {
                        if (!t || !t.trim()) return '';
                        const [h, m] = t.split(':');
                        const hour = parseInt(h, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${m} ${ampm}`;
                      };
                      const timeLabel = ev.endTime && ev.endTime.trim()
                        ? `${fmt12(ev.startTime)} – ${fmt12(ev.endTime)}`
                        : fmt12(ev.startTime);
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
                              borderColor: isLive ? '#FF3B30' : isInSchedule ? '#B87333' : 'rgba(255, 255, 255, 0.2)',
                              borderWidth: isLive ? 2 : isInSchedule ? 2 : 1,
                              opacity: isPast ? 0.5 : 1,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => onEventPress(ev)}
                          onLongPress={() => onToggleSchedule(ev)}
                          accessibilityLabel={`${ev.name}, ${ev.startTime} on ${stage}`}
                        >
                          <View style={styles.eventBlockRow}>
                            {showThumbnail && (
                              <OptimizedImage
                                uri={ev.imageUrl}
                                style={styles.eventBlockImage}
                                containerStyle={styles.eventBlockImage}
                                contentFit="cover"
                                showLoadingIndicator={false}
                                fallbackImage={require('../assets/images/logo.png')}
                              />
                            )}
                            <View style={styles.eventBlockInfo}>
                              <Text style={styles.eventBlockTitle} numberOfLines={1}>{ev.name}</Text>
                              <Text style={styles.eventBlockTime} numberOfLines={1}>{timeLabel}</Text>
                              {!!genreLine && (
                                <Text style={styles.eventBlockGenres} numberOfLines={1}>{genreLine}</Text>
                              )}
                            </View>
                          </View>
                          {isLive ? (
                            <View style={styles.eventBlockStatus} pointerEvents="none">
                              <Text style={styles.eventBlockStatusLive} numberOfLines={1}>LIVE</Text>
                            </View>
                          ) : isPast ? (
                            <View style={styles.eventBlockStatus} pointerEvents="none">
                              <Text style={styles.eventBlockStatusFinished} numberOfLines={1}>FINISHED</Text>
                            </View>
                          ) : !!timeUntil && (
                            <View style={styles.eventBlockStatus} pointerEvents="none">
                              <Text style={styles.eventBlockTimeUntilText} numberOfLines={1}>{timeUntil}</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.eventBlockHeartTouchable}
                            onPress={(e) => { e.stopPropagation(); onToggleSchedule(ev); }}
                            accessibilityLabel={isInSchedule ? 'Remove from schedule' : 'Add to schedule'}
                          >
                            <Ionicons
                              name={isInSchedule ? 'heart' : 'heart-outline'}
                              size={14}
                              color={isInSchedule ? '#B87333' : 'rgba(255,255,255,0.6)'}
                            />
                            {showThumbnail && (
                              <Text style={styles.eventBlockHeartLabel} numberOfLines={1}>
                                {isInSchedule ? 'Added' : 'Add'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </Animated.ScrollView>
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
  headerRulerViewport: {
    flex: 1,
    height: 36,
    overflow: 'hidden',
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
    top: 6,
    bottom: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  eventBlockRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },
  eventBlockImage: {
    width: ROW_HEIGHT - 12, // square-ish, fills the full block height
    height: '100%',
    marginRight: 8,
  },
  eventBlockInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  eventBlockTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventBlockTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventBlockGenres: {
    color: '#B87333',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  eventBlockStatus: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  eventBlockStatusLive: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.75,
  },
  eventBlockStatusFinished: {
    color: '#9E9E9E',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.75,
  },
  eventBlockTimeUntilText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '700',
  },
  eventBlockHeartTouchable: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventBlockHeartLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
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
