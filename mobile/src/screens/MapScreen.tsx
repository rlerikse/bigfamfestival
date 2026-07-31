import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TopNavBar from '../components/TopNavBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { getFriendLocations, getFriendCampsites, FriendLocation, FriendCampsite, FriendEntry } from '../services/friendService';
import { getWalkingRoute, formatRouteSummary, routeBounds, RouteResult, LngLat } from '../services/routingService';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import OptimizedImage from '../components/OptimizedImage';
import { useDirectionalTracking } from '../hooks/useDirectionalTracking';
import { signedAngularDiff, unwrapHeading } from '../hooks/compassFusion';

// Compass-mode camera throttle tuning. Commits are rate-limited to ~5Hz with a
// 1deg deadband so a 150ms heading animation completes before the next starts
// (prevents the animation-stacking lag from #201). Module scope so they aren't
// re-created each render.
const CAMERA_MIN_INTERVAL_MS = 200;
const CAMERA_MIN_DELTA_DEG = 1;
import DirectionalGradientBorder from '../components/DirectionalGradientBorder';
import WayfinderHUD from '../components/WayfinderHUD';

const FESTIVAL_CENTER: [number, number] = [-84.2575, 42.0577];
const DEFAULT_ZOOM = 16;

/** Distance in meters between two [lng, lat] points (haversine). */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Human-friendly distance label honoring the Settings mi/km toggle. */
function formatDistance(meters: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    const km = meters / 1000;
    return km < 0.1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
  }
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
}

// ─── POI Category System ────────────────────────────────────────────────────

export type POICategory =
  | 'stage'
  | 'food'
  | 'shop'
  | 'beverage'
  | 'staff';

interface CategoryConfig {
  label: string;
  emoji: string;
  color: string;
  markerSize: number;
  borderWidth: number;
  borderColor: string;
}

export const POI_CATEGORIES: Record<POICategory, CategoryConfig> = {
  stage: {
    label: 'Stages',
    emoji: '🎵',
    color: '#6BBF59',
    markerSize: 36,
    borderWidth: 3,
    borderColor: '#fff',
  },
  food: {
    label: 'Food Vendors',
    emoji: '🍔',
    color: '#E8A838',
    markerSize: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  shop: {
    label: 'Shops & Services',
    emoji: '🛍️',
    color: '#A78BFA',
    markerSize: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  beverage: {
    label: 'Beverage Vendors',
    emoji: '🍺',
    color: '#F59E0B',
    markerSize: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  staff: {
    label: 'Staff & Medical',
    emoji: '🏥',
    color: '#EF4444',
    markerSize: 38,
    borderWidth: 3,
    borderColor: '#fff',
  },
};

/** Normalise a raw category string from Firestore to a POICategory key. */
function resolveCategory(raw: string): POICategory {
  const s = (raw ?? '').toLowerCase().trim();
  if (s === 'stage' || s === 'stages') return 'stage';
  if (s === 'food' || s === 'food vendor' || s === 'food vendors' || s === 'food_vendor') return 'food';
  if (s === 'shop' || s === 'shops' || s === 'services' || s === 'shops & services' || s === 'shop_and_service') return 'shop';
  if (s === 'beverage' || s === 'beverages' || s === 'beverage vendor' || s === 'beverage vendors' || s === 'beverage_vendor') return 'beverage';
  if (s === 'staff' || s === 'medical' || s === 'staff & medical' || s === 'first aid' || s === 'staff_and_medical') return 'staff';
  return 'food'; // safe default
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapZone {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    category: string;
    color: string;
    icon?: string;
    description?: string;
  };
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: number[][] | number[][][] | number[];
  };
}

interface MapPOI {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  lat: number;
  lng: number;
  description?: string;
}

interface StageLocation {
  name: string;
  lat: number;
  lng: number;
  color: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { distanceUnit } = useAppSettings();
  const [selfCoords, setSelfCoords] = useState<[number, number] | null>(null);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [pois, setPois] = useState<MapPOI[]>([]);
  const [stages, setStages] = useState<StageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<(MapPOI | StageLocation) | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const mapViewRef = useRef<Mapbox.MapView>(null);
  // Current map viewport bounds [[rightLon, topLat], [leftLon, bottomLat]] —
  // used so the friend-radar HUD can hide a friend's edge-icon once they're
  // already visible within the on-map view (avoids the "two icons for one
  // friend" bug where zooming out to include a friend still showed them
  // pinned to the screen edge instead of merging into a single marker).
  const [visibleBounds, setVisibleBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [currentBearing, setCurrentBearing] = useState(0);

  // ── Routing (walking directions to a POI/friend) ──────────────────────────
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [routeLabel, setRouteLabel] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  // Current route target — kept separately from the route result so we can
  // live-recalculate as the user walks (routing was previously one-shot: it
  // fetched once and never updated, so the line went stale mid-walk).
  const routeTargetRef = useRef<{ dest: LngLat; label: string } | null>(null);
  const lastRouteOriginRef = useRef<LngLat | null>(null);
  // Always-current friend markers, so the navigation callback never uses a
  // stale snapshot (functions passed via nav params capture their closure).
  const friendMarkersRef = useRef<Array<(FriendLocation | FriendCampsite) & { isLive: boolean }>>([]);

  // Friends — live locations + campsites (privacy: backend only returns
  // entries for accepted friends who have opted in to sharing)
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [friendCampsites, setFriendCampsites] = useState<FriendCampsite[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<((FriendLocation | FriendCampsite) & { isLive: boolean }) | null>(null);

  // ── Directional "hot/cold" tracking mode (per #159) ────────────────────────
  // A separate per-friend focus state, layered ON TOP of the friend-radar HUD
  // (radar markers keep rendering regardless — Robert confirmed both coexist).
  const [trackingTarget, setTrackingTarget] = useState<(FriendLocation | FriendCampsite) & { isLive: boolean } | null>(null);
  const trackingCoords: LngLat | null = trackingTarget ? [trackingTarget.lng, trackingTarget.lat] : null;

  // ── Orientation mode — CoD top-down mini-map model (per Robert's #159 refinement) ──
  // Underlying location tracking + haptics are ALWAYS on regardless of mode —
  // this toggle only controls what moves visually on screen:
  //  - 'north': map stays fixed/north-up. Self marker shows a rotating
  //    direction arrow (device heading) instead of moving the map. Friend
  //    icons are visually frozen in place (snapshotted) — they do not
  //    reposition on screen even though their underlying data keeps updating.
  //  - 'compass' (default): map itself rotates to match device heading, self
  //    marker points a fixed "up," and friend icons actively reposition as
  //    their live location changes.
  const [orientationMode, setOrientationMode] = useState<'compass' | 'north'>('compass');
  // Only stream the magnetometer when there's actually something to point at —
  // either friends visible on the radar (icons need live heading to swing
  // around the border) or an active tracking target. Avoids draining battery
  // when the map has zero friends loaded. friendMarkers itself is derived
  // later in render, so we track its presence via the same ref the HUD uses.
  const [hasFriendMarkers, setHasFriendMarkers] = useState(false);
  // Underlying tracking data (heading stream, bearing/closeness calc, haptics)
  // stays fully live in BOTH orientation modes — north-lock only affects what
  // repositions visually on screen, never the tracking data itself.
  const needsHeading = hasFriendMarkers || trackingCoords !== null;
  const { closeness, isLocked, heading } = useDirectionalTracking(selfCoords, trackingCoords, needsHeading);

  // In compass mode, rotate the camera to match the live device heading so
  // the map itself points "up" in the direction Robert is physically facing.
  // In north mode the camera heading stays pinned at 0 (map never rotates);
  // facing direction is instead shown via the self-marker's rotating arrow.
  //
  // The heading stream updates at ~10Hz (100ms). Firing a 150ms camera
  // animation on every one of those made a fresh animation start before the
  // previous finished — they stacked and the camera perpetually chased a
  // target it never reached, which read as lag/rubber-banding (Robert's #201
  // report). We instead throttle camera commits to ~5Hz and skip sub-degree
  // changes (deadband), so each animation can complete before the next and
  // tiny sensor jitter doesn't churn the camera.
  //
  // Wrap-around unwind (Robert's #202 retest — "full spin before settling"):
  // the fused heading is normalized to [0,360), so when it crosses the 0/360
  // seam (e.g. 359 -> 1) a naive setCamera({heading}) makes Mapbox animate the
  // LONG way around (-358 deg) = a visible full spin. We feed the camera a
  // CONTINUOUS/unwrapped bearing instead: track the last committed unwrapped
  // value and advance it by the shortest signed delta each commit, so
  // consecutive numbers never jump >180 deg and the camera always takes the
  // short visual path. Mapbox normalizes the value internally, so the extra
  // winding in the number is harmless.
  //
  // Trailing flush (Architect review, PR #202): a pure leading-edge throttle
  // would permanently drop the LAST heading of a burst whenever the final
  // update lands inside the interval guard — the camera would settle 1-2 deg
  // off true, and slow continuous turns near the 5Hz boundary could
  // under-sample. So when we skip a commit due to the interval guard, we
  // schedule a deferred commit for the remainder of the interval; the newest
  // heading always wins because the effect re-runs (and reschedules) on every
  // heading change, and the timer reads from a ref holding the latest value.
  const lastCameraHeadingRef = useRef(0);
  const unwrappedCameraHeadingRef = useRef(0);
  const lastCameraCommitRef = useRef(0);
  const pendingHeadingRef = useRef(0);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (orientationMode !== 'compass') return;

    const commit = (h: number) => {
      // Advance the continuous bearing by the shortest signed step from the
      // last normalized value, so a 0/360 seam crossing unwinds instead of
      // spinning the long way.
      unwrappedCameraHeadingRef.current = unwrapHeading(
        unwrappedCameraHeadingRef.current,
        lastCameraHeadingRef.current,
        h
      );
      lastCameraCommitRef.current = Date.now();
      lastCameraHeadingRef.current = h;
      cameraRef.current?.setCamera({
        heading: unwrappedCameraHeadingRef.current,
        animationDuration: 150,
      });
    };

    pendingHeadingRef.current = heading;
    const now = Date.now();
    const sinceLast = now - lastCameraCommitRef.current;
    const delta = Math.abs(signedAngularDiff(lastCameraHeadingRef.current, heading));

    if (delta < CAMERA_MIN_DELTA_DEG) return;

    if (sinceLast >= CAMERA_MIN_INTERVAL_MS) {
      // Leading edge: enough time has passed, commit immediately and cancel any
      // queued trailing commit (this one supersedes it).
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
      commit(heading);
      return;
    }

    // Inside the interval guard: schedule a trailing commit for the remaining
    // time so the final heading of the burst still lands. If one is already
    // queued, leave it — it'll pick up the latest pendingHeadingRef when it
    // fires.
    if (!trailingTimerRef.current) {
      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null;
        commit(pendingHeadingRef.current);
      }, CAMERA_MIN_INTERVAL_MS - sinceLast);
    }
  }, [orientationMode, heading]);

  // Cancel any queued trailing camera commit when leaving compass mode or on
  // unmount, so a stale heading can't fire after the mode switch/teardown.
  useEffect(() => {
    return () => {
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (orientationMode !== 'compass') {
      // Leaving compass: cancel any queued trailing commit. Camera is reset to
      // heading 0 by the toggle, so re-seed the unwrapped bearing to 0 and
      // clear the last-normalized reference. On re-entry the first commit then
      // unwinds from 0 toward the live heading via the shortest path, instead
      // of jumping by a stale accumulated offset.
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
      unwrappedCameraHeadingRef.current = 0;
      lastCameraHeadingRef.current = 0;
    }
  }, [orientationMode]);

  const toggleOrientationMode = useCallback(() => {
    setOrientationMode(prev => {
      const next = prev === 'compass' ? 'north' : 'compass';
      if (next === 'north') {
        cameraRef.current?.setCamera({ heading: 0, animationDuration: 300 });
      }
      return next;
    });
  }, []);

  // Friend-icon position freeze for north-lock mode: friend location DATA
  // keeps updating live underneath (radar/tracking logic untouched), but the
  // on-screen marker position is snapshotted the moment north-lock engages
  // and held there until the user switches back to compass mode. This is the
  // CoD mini-map behavior Robert asked for — map stays still, so friend
  // blips shouldn't visually drift either.
  const [frozenFriendPositions, setFrozenFriendPositions] = useState<Record<string, [number, number]> | null>(null);
  useEffect(() => {
    if (orientationMode === 'north' && !frozenFriendPositions) {
      const snapshot: Record<string, [number, number]> = {};
      friendMarkersRef.current.forEach(f => {
        snapshot[f.userId] = [f.lng, f.lat];
      });
      setFrozenFriendPositions(snapshot);
    } else if (orientationMode === 'compass' && frozenFriendPositions) {
      setFrozenFriendPositions(null);
    }
  }, [orientationMode, frozenFriendPositions]);

  // All categories visible by default
  const [visibleCategories, setVisibleCategories] = useState<Set<POICategory>>(
    new Set(Object.keys(POI_CATEGORIES) as POICategory[])
  );
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  // Track the current user's own coordinates so their marker can render their
  // profile-pic avatar (instead of relying solely on the anonymous LocationPuck).
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setSelfCoords([initial.coords.longitude, initial.coords.latitude]);
      } catch (err) {
        console.error('[MapScreen] Failed to get initial self location:', err);
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (loc) => setSelfCoords([loc.coords.longitude, loc.coords.latitude])
      );
    })();
    return () => subscription?.remove();
  }, []);

  // Load friend campsites + live locations. Locations are refreshed on an
  // interval since friends' positions can change; campsites are more static.
  const loadFriendData = useCallback(async () => {
    console.log('[Map] Loading friend locations/campsites...');
    try {
      const [locations, campsites] = await Promise.all([
        getFriendLocations(),
        getFriendCampsites(),
      ]);
      setFriendLocations(locations);
      setFriendCampsites(campsites);
      console.log(
        `[Map] Loaded ${locations.length} live friend location(s), ${campsites.length} friend campsite(s)`
      );
    } catch (err) {
      // Non-fatal: friends layer failing shouldn't block the rest of the map
      console.error('[MapScreen] Failed to load friend locations/campsites:', err);
    }
  }, []);

  useEffect(() => {
    loadFriendData();
    const interval = setInterval(loadFriendData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [loadFriendData]);

  const loadMapData = async () => {
    try {
      const [zonesSnap, stagesSnap] = await Promise.all([
        getDoc(doc(firestore, 'config', 'mapZones')),
        getDoc(doc(firestore, 'config', 'mapStages')),
      ]);

      if (zonesSnap.exists()) {
        const data = zonesSnap.data();
        if (data?.geojson) {
          const parsed = JSON.parse(data.geojson);
          setZones(parsed.features || []);
        }
      }

      if (stagesSnap.exists()) {
        const data = stagesSnap.data();
        if (data?.stages) {
          const stageList: StageLocation[] = Object.values(data.stages);
          setStages(stageList);
        }
      }

      const poisSnap = await getDocs(collection(firestore, 'mapPOIs'));
      const poiList: MapPOI[] = poisSnap.docs.map(d => ({ id: d.id, ...d.data() } as MapPOI));
      setPois(poiList);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  const zoneGeoJSON = {
    type: 'FeatureCollection' as const,
    features: zones.filter(z => z.geometry.type === 'Polygon'),
  };

  const handlePOIPress = useCallback((poi: MapPOI | StageLocation) => {
    setSelectedPOI(prev => prev === poi ? null : poi);
  }, []);

  const toggleCategory = useCallback((cat: POICategory) => {
    setVisibleCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(currentZoom + 1, 20);
    setCurrentZoom(newZoom);
    cameraRef.current?.setCamera({ zoomLevel: newZoom, animationDuration: 300 });
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(currentZoom - 1, 10);
    setCurrentZoom(newZoom);
    cameraRef.current?.setCamera({ zoomLevel: newZoom, animationDuration: 300 });
  }, [currentZoom]);

  const handleCenterOnUser = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        cameraRef.current?.setCamera({
          centerCoordinate: FESTIVAL_CENTER,
          zoomLevel: DEFAULT_ZOOM,
          animationDuration: 500,
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: Math.max(currentZoom, 16),
        animationDuration: 500,
      });
    } catch {
      cameraRef.current?.setCamera({
        centerCoordinate: FESTIVAL_CENTER,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 500,
      });
    }
  }, [currentZoom]);

  // ── Routing helpers ───────────────────────────────────────────
  /** Best-effort current user coordinate: live selfCoords, else a fresh fix. */
  const getUserCoords = useCallback(async (): Promise<LngLat | null> => {
    if (selfCoords) return selfCoords;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return [loc.coords.longitude, loc.coords.latitude];
    } catch (err) {
      console.error('[Map] Could not get user location for routing:', err);
      return null;
    }
  }, [selfCoords]);

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setRouteLabel(null);
    routeTargetRef.current = null;
    lastRouteOriginRef.current = null;
  }, []);

  /** Fetch + draw a walking route from the user to a destination pin. */
  const routeToDestination = useCallback(async (dest: LngLat, label: string) => {
    if (routing) return;
    setRouting(true);
    try {
      const origin = await getUserCoords();
      if (!origin) {
        Alert.alert(
          'Location needed',
          'Enable location access so we can route you from where you are.'
        );
        return;
      }
      const route = await getWalkingRoute(origin, dest);
      if (!route) {
        Alert.alert('No route found', `Couldn't find a walking route to ${label}. Try again.`);
        return;
      }
      setActiveRoute(route);
      setRouteLabel(`${label} • ${formatRouteSummary(route, distanceUnit)}`);
      // Remember the target + origin so the live-recalculation effect below
      // can keep the line current as the user (or a live friend target) moves,
      // instead of the old one-shot fetch-and-forget behavior.
      routeTargetRef.current = { dest, label };
      lastRouteOriginRef.current = origin;
      // Fit the camera to the whole route so both ends are visible.
      const b = routeBounds(route);
      cameraRef.current?.fitBounds(b.ne, b.sw, 90, 700);
    } finally {
      setRouting(false);
    }
  }, [routing, getUserCoords, distanceUnit]);

  // Live route recalculation — re-fetch the walking route whenever the user's
  // position moves meaningfully while a route is active. Previously routing
  // was one-shot (fetched once, never updated), so the drawn line went stale
  // the moment the user started walking. We debounce on a meter threshold so
  // we're not hammering the Directions API on every GPS tick.
  const RECALC_MIN_METERS = 25;
  useEffect(() => {
    if (!activeRoute || !routeTargetRef.current || !selfCoords) return;
    const lastOrigin = lastRouteOriginRef.current;
    if (lastOrigin) {
      const moved = haversineMeters(lastOrigin, selfCoords);
      if (moved < RECALC_MIN_METERS) return;
    }
    let cancelled = false;
    (async () => {
      const target = routeTargetRef.current;
      if (!target) return;
      const route = await getWalkingRoute(selfCoords, target.dest);
      if (cancelled || !route || !routeTargetRef.current) return;
      setActiveRoute(route);
      setRouteLabel(`${target.label} • ${formatRouteSummary(route, distanceUnit)}`);
      lastRouteOriginRef.current = selfCoords;
    })();
    return () => {
      cancelled = true;
    };
  }, [selfCoords, activeRoute, distanceUnit]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const stagesVisible = visibleCategories.has('stage');

  // Round to nearest degree for the compass label; treat near-0/360 as "N"
  const compassHeadingLabel = (() => {
    const normalized = ((currentBearing % 360) + 360) % 360;
    return `${Math.round(normalized)}°`;
  })();

  const filteredPOIs = pois.filter(poi => {
    const cat = resolveCategory(poi.category);
    return visibleCategories.has(cat);
  });

  // Merge friend markers: prefer live location over campsite when both exist
  // for the same friend, so we don't render two overlapping pins.
  //
  // Memoized on [friendLocations, friendCampsites]: previously this was a bare
  // IIFE that rebuilt a new array + new objects on EVERY render. Because the
  // compass heading state updates at ~10Hz, MapScreen re-renders constantly, so
  // an un-memoized friendMarkers handed a fresh `friends` array to WayfinderHUD
  // every frame — busting the HUD's internal useMemo and re-projecting every
  // border radar icon against the (noisy) live heading each tick. That churn
  // was a primary driver of the "friend icons bouncing around the screen edge"
  // report. A stable identity here lets the HUD only recompute when friend data
  // actually changes.
  const friendMarkers: Array<(FriendLocation | FriendCampsite) & { isLive: boolean }> = useMemo(() => {
    const liveIds = new Set(friendLocations.map(f => f.userId));
    const live = friendLocations.map(f => ({ ...f, isLive: true }));
    const campsitesOnly = friendCampsites
      .filter(f => !liveIds.has(f.userId))
      .map(f => ({ ...f, isLive: false }));
    return [...live, ...campsitesOnly];
  }, [friendLocations, friendCampsites]);

  // Stable-identity friend list for the WayfinderHUD radar, derived from the
  // memoized friendMarkers. Passing friendMarkers.map(...) inline created a new
  // array every render (see note above) — memoizing keeps the HUD's `friends`
  // prop identity stable so its internal radar useMemo only recomputes on real
  // friend/heading changes, not on every parent re-render.
  const wayfinderFriends = useMemo(
    () =>
      friendMarkers.map(f => ({
        userId: f.userId,
        name: f.name,
        profilePictureUrl: f.profilePictureUrl,
        lat: f.lat,
        lng: f.lng,
      })),
    [friendMarkers]
  );

  useEffect(() => {
    friendMarkersRef.current = friendMarkers;
    setHasFriendMarkers(friendMarkers.length > 0);
    if (friendMarkers.length > 0) {
      friendMarkers.forEach(friend => {
        console.log(
          `[Map] Rendering friend marker for ${friend.name} (${friend.isLive ? 'live' : 'campsite'})`
        );
      });
    }
  }, [friendMarkers]);

  const handleOpenFriendsList = useCallback(() => {
    console.log('[Map] Opening friend list...');
    (navigation as unknown as { navigate: (name: string, params?: unknown) => void }).navigate('Friends', {
      onSelectFriend: (friend: FriendEntry) => {
        // Read markers from the ref, not a captured snapshot, so a friend whose
        // location loaded/changed while the list was open still resolves.
        const match = friendMarkersRef.current.find(f => f.userId === friend.userId);
        if (match) {
          console.log(`[Map] Routing to friend ${friend.name}`);
          setSelectedFriend(match);
          setSelectedPOI(null);
          void routeToDestination([match.lng, match.lat], friend.name || 'friend');
        } else {
          console.log(`[Map] No marker found for selected friend ${friend.name} (no location/campsite data)`);
          Alert.alert(
            'No location for this friend',
            `${friend.name || 'They'} isn't sharing a live location or campsite right now.`
          );
        }
      },
    });
  }, [navigation, routeToDestination]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6BBF59" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapViewRef}
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        // Android: use a TextureView (surfaceView=false) instead of the default
        // GLSurfaceView. A GLSurfaceView punches through the React Native view
        // hierarchy, so overlaid RN views (our absolute TopNavBar / controls)
        // are hidden behind the map on Android — that's why the top nav was
        // missing on Android only. TextureView composites within the RN tree.
        surfaceView={Platform.OS === 'android' ? false : undefined}
        compassEnabled={false}
        logoEnabled={true}
        attributionEnabled={true}
        attributionPosition={{ bottom: 80, left: 8 }}
        logoPosition={{ bottom: 80, left: 8 }}
        onCameraChanged={(state) => {
          if (state?.properties?.zoom != null) {
            setCurrentZoom(state.properties.zoom);
          }
          if (state?.properties?.heading != null) {
            setCurrentBearing(state.properties.heading);
          }
          // Refresh visible bounds on every camera move so the radar HUD
          // knows which friends are already on-screen. getVisibleBounds()
          // is async; fire-and-forget is fine here, it just updates state
          // whenever it resolves (camera changes fire frequently enough
          // that a slight lag doesn't matter for this UI purpose).
          mapViewRef.current?.getVisibleBounds()
            .then(bounds => setVisibleBounds(bounds as [[number, number], [number, number]]))
            .catch(() => undefined);
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: FESTIVAL_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
          // Explicit centerCoordinate/zoomLevel in addition to defaultSettings:
          // on Android release builds defaultSettings alone frequently fails to
          // apply the initial frame, leaving the map at the world/default view
          // ("in the ocean"). Setting them directly frames the festival grounds
          // on first render. followUserLocation stays off so we don't yank the
          // camera away from the site.
          centerCoordinate={FESTIVAL_CENTER}
          zoomLevel={DEFAULT_ZOOM}
          animationDuration={0}
        />

        {/* User location — no default LocationPuck: the blue dot would cover our
            profile-pic avatar marker below. The self-marker (green ring +
            profile pic / initials) is the sole "you are here" indicator. */}

        {/* Self avatar marker — rendered on top of the LocationPuck so the user
            sees their own profile picture at their live position, matching the
            friend-marker treatment (see friendMarkers below). Falls back to
            initials/icon (never a plain dot) if no profilePictureUrl is set. */}
        {selfCoords && (
          <Mapbox.PointAnnotation
            key="self-marker"
            id="self-marker"
            coordinate={selfCoords}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.friendMarker, styles.friendMarkerLive, styles.selfMarker]}>
              {user?.profilePictureUrl ? (
                <OptimizedImage
                  uri={user.profilePictureUrl}
                  style={styles.friendMarkerImage}
                  containerStyle={styles.friendMarkerImage}
                  contentFit="cover"
                  showLoadingIndicator={false}
                  fallbackIcon="person-circle-outline"
                />
              ) : (
                <Text style={styles.friendMarkerInitial}>
                  {user?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
              {/* North-lock mode: map itself stays fixed, so facing direction
                  is shown via this rotating arrow instead (CoD mini-map style).
                  In compass mode the map rotates under the marker instead, so
                  the arrow stays hidden — the marker itself always points "up." */}
              {orientationMode === 'north' && (
                <View
                  pointerEvents="none"
                  style={[styles.selfHeadingArrowWrap, { transform: [{ rotate: `${heading}deg` }] }]}
                >
                  <Ionicons name="caret-up" size={16} color="#6BBF59" style={styles.selfHeadingArrow} />
                </View>
              )}
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Zone polygons */}
        {zoneGeoJSON.features.length > 0 && (
          <Mapbox.ShapeSource id="zones" shape={zoneGeoJSON as GeoJSON.FeatureCollection}>
            <Mapbox.FillLayer
              id="zone-fills"
              style={{ fillColor: ['get', 'color'], fillOpacity: 0.25 }}
            />
            <Mapbox.LineLayer
              id="zone-outlines"
              style={{ lineColor: ['get', 'color'], lineWidth: 2 }}
            />
            <Mapbox.SymbolLayer
              id="zone-labels"
              style={{
                textField: ['get', 'name'],
                textSize: 14,
                textColor: '#ffffff',
                textHaloColor: '#000000',
                textHaloWidth: 1.5,
                textAllowOverlap: true,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Stage markers */}
        {stagesVisible && stages.map(stage => {
          const cfg = POI_CATEGORIES.stage;
          return (
            <Mapbox.PointAnnotation
              key={stage.name}
              id={`stage-${stage.name}`}
              coordinate={[stage.lng, stage.lat]}
              onSelected={() => handlePOIPress(stage)}
            >
              <View style={[
                styles.marker,
                {
                  width: cfg.markerSize,
                  height: cfg.markerSize,
                  borderRadius: cfg.markerSize / 2,
                  backgroundColor: stage.color || cfg.color,
                  borderWidth: cfg.borderWidth,
                  borderColor: cfg.borderColor,
                },
              ]}>
                <Text style={styles.markerEmoji}>{cfg.emoji}</Text>
              </View>
              <Mapbox.Callout title={stage.name} />
            </Mapbox.PointAnnotation>
          );
        })}

        {/* POI markers — category-driven */}
        {filteredPOIs.map(poi => {
          const cat = resolveCategory(poi.category);
          const cfg = POI_CATEGORIES[cat];
          const isStaff = cat === 'staff';
          return (
            <Mapbox.PointAnnotation
              key={poi.id}
              id={`poi-${poi.id}`}
              coordinate={[poi.lng, poi.lat]}
              onSelected={() => handlePOIPress(poi)}
            >
              <View style={[
                styles.marker,
                {
                  width: cfg.markerSize,
                  height: cfg.markerSize,
                  borderRadius: cfg.markerSize / 2,
                  backgroundColor: cfg.color,
                  borderWidth: cfg.borderWidth,
                  borderColor: cfg.borderColor,
                },
                // Staff/Medical: extra prominence
                isStaff && styles.staffMarkerExtra,
              ]}>
                <Text style={[styles.markerEmoji, isStaff && styles.staffMarkerEmojiLarge]}>
                  {cfg.emoji}
                </Text>
              </View>
              <Mapbox.Callout title={poi.name} />
            </Mapbox.PointAnnotation>
          );
        })}

        {/* Friend markers — accepted friends only, opted-in to location/campsite sharing (per backend privacy rules) */}
        {friendMarkers.map(friend => {
          // North-lock mode: visually freeze friend icons at the position
          // snapshotted when the mode engaged, even though `friend.lng/lat`
          // keeps updating live underneath. Compass mode always uses the
          // live coordinate.
          const frozen = orientationMode === 'north' ? frozenFriendPositions?.[friend.userId] : undefined;
          const displayCoordinate: [number, number] = frozen ?? [friend.lng, friend.lat];
          return (
          <Mapbox.PointAnnotation
            key={`friend-${friend.userId}`}
            id={`friend-${friend.userId}`}
            coordinate={displayCoordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onSelected={() => setSelectedFriend(prev => (prev?.userId === friend.userId ? null : friend))}
          >
            <View style={[
              styles.friendMarker,
              friend.isLive && styles.friendMarkerLive,
              trackingTarget?.userId === friend.userId && styles.friendMarkerTracking,
            ]}>
              {friend.profilePictureUrl ? (
                <OptimizedImage
                  uri={friend.profilePictureUrl}
                  style={styles.friendMarkerImage}
                  containerStyle={styles.friendMarkerImage}
                  contentFit="cover"
                  showLoadingIndicator={false}
                  fallbackIcon="person-circle-outline"
                />
              ) : (
                <Text style={styles.friendMarkerInitial}>
                  {friend.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
            <Mapbox.Callout title={`${friend.name}${friend.isLive ? ' • Live' : ' • Campsite'}`} />
          </Mapbox.PointAnnotation>
          );
        })}

        {/* Active walking route line (user → selected POI/friend) */}
        {activeRoute && (
          <Mapbox.ShapeSource id="active-route" shape={activeRoute.geojson}>
            <Mapbox.LineLayer
              id="active-route-casing"
              style={{
                lineColor: '#0B3D2E',
                lineWidth: 8,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
            <Mapbox.LineLayer
              id="active-route-line"
              style={{
                lineColor: '#6BBF59',
                lineWidth: 4.5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      {/* Friend-radar HUD — always-visible border-anchored icons for every
          visible friend (per #159). This renders regardless of tracking
          state; the gradient border below is an ADDITIVE focus layer for
          whichever single friend is selected, never a replacement. */}
      <WayfinderHUD
        userCoords={selfCoords}
        heading={heading}
        visibleBounds={visibleBounds}
        friends={wayfinderFriends}
        trackedFriendId={trackingTarget?.userId ?? null}
        distanceUnit={distanceUnit}
        onSelectFriend={(f) => {
          const match = friendMarkers.find(fm => fm.userId === f.userId);
          if (match) setSelectedFriend(match);
        }}
      />

      {/* Directional hot/cold gradient overlay — only while a friend is under
          active tracking focus. Renders ON TOP of the map but BELOW the top
          nav/controls, and does not affect the friend-radar HUD markers
          above, which keep rendering regardless (both coexist per #159). */}
      {trackingTarget && (
        <DirectionalGradientBorder closeness={closeness} isLocked={isLocked} />
      )}

      {/* Top NavBar — rendered as a direct child of the map container (not
          wrapped in another absolute View). TopNavBar already positions itself
          absolute at top:0 with elevation:2000; nesting it inside a second
          absolute+elevated wrapper broke Android compositing over the native
          Mapbox TextureView (nav vanished on Android only). */}
      <TopNavBar showSearchBar={false} whiteIcons />

      {/* Map Controls — right side (filters, compass, zoom, locate — all in-line) */}
      <View style={[styles.mapControls, { top: insets.top + 110 }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setLegendOpen(v => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name={legendOpen ? 'layers' : 'layers-outline'} size={22} color="#F5F5DC" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleOrientationMode}
          activeOpacity={0.7}
          accessibilityLabel={
            orientationMode === 'compass'
              ? `Compass mode, heading ${compassHeadingLabel}. Tap to lock to north.`
              : 'North-locked. Tap to resume compass mode and friend tracking.'
          }
        >
          <Ionicons
            name={orientationMode === 'compass' ? 'compass' : 'compass-outline'}
            size={24}
            color={orientationMode === 'compass' ? '#F5F5DC' : '#8A8A6E'}
            style={orientationMode === 'compass' ? { transform: [{ rotate: `${-currentBearing}deg` }] } : undefined}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#F5F5DC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut} activeOpacity={0.7}>
          <Ionicons name="remove" size={24} color="#F5F5DC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleCenterOnUser} activeOpacity={0.7}>
          <Ionicons name="navigate" size={22} color="#F5F5DC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleOpenFriendsList} activeOpacity={0.7}>
          <Ionicons name="person" size={22} color="#F5F5DC" />
        </TouchableOpacity>
      </View>

      {/* Filter / Legend panel */}
      {legendOpen && (
        <View style={[styles.legendPanel, { top: insets.top + 164 }]}>
          <Text style={styles.legendTitle}>Map Layers</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {(Object.entries(POI_CATEGORIES) as [POICategory, CategoryConfig][]).map(([key, cfg]) => {
              const active = visibleCategories.has(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.legendRow, !active && styles.legendRowInactive]}
                  onPress={() => toggleCategory(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.legendSwatch, { backgroundColor: cfg.color, opacity: active ? 1 : 0.35 }]} />
                  <Text style={[styles.legendEmoji]}>{cfg.emoji}</Text>
                  <Text style={[styles.legendLabel, !active && styles.legendLabelInactive]}>
                    {cfg.label}
                  </Text>
                  <Ionicons
                    name={active ? 'eye' : 'eye-off-outline'}
                    size={16}
                    color={active ? '#6BBF59' : 'rgba(245,245,220,0.3)'}
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Selected POI info card */}
      {selectedPOI && (() => {
        const cat = 'category' in selectedPOI
          ? resolveCategory(selectedPOI.category)
          : 'stage';
        const cfg = POI_CATEGORIES[cat];
        return (
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoCardClose}
              onPress={() => setSelectedPOI(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#F5F5DC" />
            </TouchableOpacity>
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoCardDot, { backgroundColor: cfg.color }]}>
                <Text style={styles.infoCardDotEmoji}>{cfg.emoji}</Text>
              </View>
              <Text style={styles.infoCardTitle}>{selectedPOI.name}</Text>
            </View>
            {'description' in selectedPOI && selectedPOI.description ? (
              <Text style={styles.infoCardDesc}>{selectedPOI.description}</Text>
            ) : null}
            <Text style={[styles.infoCardCategory, { color: cfg.color }]}>
              {cfg.label.toUpperCase()}
            </Text>
            <TouchableOpacity
              style={[styles.directionsBtn, routing && styles.directionsBtnDisabled]}
              disabled={routing}
              activeOpacity={0.85}
              onPress={() => routeToDestination([selectedPOI.lng, selectedPOI.lat], selectedPOI.name)}
            >
              {routing ? (
                <ActivityIndicator size="small" color="#0B3D2E" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#0B3D2E" />
                  <Text style={styles.directionsBtnText}>Directions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Selected friend info card — route + track (hot/cold) toggle */}
      {selectedFriend && (
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoCardClose}
            onPress={() => setSelectedFriend(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#F5F5DC" />
          </TouchableOpacity>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardDot, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
            <Text style={styles.infoCardTitle}>{selectedFriend.name}</Text>
          </View>
          <Text style={[styles.infoCardCategory, { color: selectedFriend.isLive ? '#6BBF59' : '#F59E0B' }]}>
            {selectedFriend.isLive ? 'LIVE LOCATION' : 'CAMPSITE'}
            {selfCoords ? ` • ${formatDistance(haversineMeters(selfCoords, [selectedFriend.lng, selectedFriend.lat]), distanceUnit)}` : ''}
          </Text>
          <View style={styles.friendCardActions}>
            <TouchableOpacity
              style={[styles.directionsBtn, routing && styles.directionsBtnDisabled, { flex: 1 }]}
              disabled={routing}
              activeOpacity={0.85}
              onPress={() => routeToDestination([selectedFriend.lng, selectedFriend.lat], selectedFriend.name)}
            >
              {routing ? (
                <ActivityIndicator size="small" color="#0B3D2E" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#0B3D2E" />
                  <Text style={styles.directionsBtnText}>Directions</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.trackBtn,
                trackingTarget?.userId === selectedFriend.userId && styles.trackBtnActive,
              ]}
              activeOpacity={0.85}
              onPress={() =>
                setTrackingTarget(prev =>
                  prev?.userId === selectedFriend.userId ? null : selectedFriend
                )
              }
            >
              <Ionicons
                name={trackingTarget?.userId === selectedFriend.userId ? 'radio' : 'radio-outline'}
                size={18}
                color={trackingTarget?.userId === selectedFriend.userId ? '#0B3D2E' : '#F5F5DC'}
              />
              <Text
                style={[
                  styles.trackBtnText,
                  trackingTarget?.userId === selectedFriend.userId && styles.trackBtnTextActive,
                ]}
              >
                {trackingTarget?.userId === selectedFriend.userId ? 'Tracking' : 'Track'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active route summary + clear control */}
      {activeRoute && routeLabel && (
        <View style={styles.routeBanner}>
          <Ionicons name="walk" size={18} color="#0B3D2E" />
          <Text style={styles.routeBannerText} numberOfLines={1}>{routeLabel}</Text>
          <TouchableOpacity
            onPress={clearRoute}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={22} color="#0B3D2E" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C2B20',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#F5F5DC',
    fontSize: 16,
    opacity: 0.6,
  },

  // ── Markers ────────────────────────────────────────────────────────────────
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 14,
  },
  staffMarkerExtra: {
    // White outer ring to stand out on dark map
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  staffMarkerEmojiLarge: {
    fontSize: 18,
  },

  // ── Friend markers ───────────────────────────────────────────────────
  friendMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  friendMarkerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  selfMarker: {
    backgroundColor: '#6BBF59',
  },
  selfHeadingArrowWrap: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfHeadingArrow: {
    textShadowColor: '#0B3D2E',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  friendMarkerLive: {
    borderColor: '#6BBF59',
    shadowColor: '#6BBF59',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  friendMarkerTracking: {
    borderColor: '#F59E0B',
    borderWidth: 4,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10, // Android has no shadow-glow equivalent — elevation gives visual parity for the tracking highlight.
  },
  friendMarkerInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Map Controls ──────────────────────────────────────────────────────────
  mapControls: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    elevation: 10,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 43, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Legend panel ──────────────────────────────────────────────────────────
  legendPanel: {
    position: 'absolute',
    right: 12,
    width: 210,
    backgroundColor: 'rgba(20, 34, 24, 0.95)',
    borderRadius: 14,
    padding: 12,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    maxHeight: 280,
  },
  legendTitle: {
    color: '#F5F5DC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 8,
  },
  legendRowInactive: {
    opacity: 0.5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendEmoji: {
    fontSize: 14,
  },
  legendLabel: {
    color: '#F5F5DC',
    fontSize: 13,
    fontWeight: '500',
  },
  legendLabelInactive: {
    opacity: 0.5,
  },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#1C2B20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCardDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardDotEmoji: {
    fontSize: 14,
  },
  infoCardTitle: {
    color: '#F5F5DC',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  infoCardDesc: {
    color: 'rgba(245, 245, 220, 0.6)',
    fontSize: 14,
    marginTop: 6,
  },
  infoCardCategory: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
  infoCardClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 2,
  },
  directionsBtn: {
    marginTop: 14,
    backgroundColor: '#6BBF59',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsBtnDisabled: {
    opacity: 0.6,
  },
  directionsBtnText: {
    color: '#0B3D2E',
    fontSize: 15,
    fontWeight: '700',
  },
  friendCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(245, 245, 220, 0.12)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.3)',
  },
  trackBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  trackBtnText: {
    color: '#F5F5DC',
    fontSize: 15,
    fontWeight: '700',
  },
  trackBtnTextActive: {
    color: '#0B3D2E',
  },
  routeBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    backgroundColor: '#6BBF59',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  routeBannerText: {
    flex: 1,
    color: '#0B3D2E',
    fontSize: 14,
    fontWeight: '700',
  },
});
