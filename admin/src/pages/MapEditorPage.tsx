import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
// @ts-expect-error mapbox-gl-draw has no types
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Copy, Download, MousePointer, Save, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Music } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { POIManager, POI } from '@/components/POIManager';
import { getImageDisplayUrl, uploadZoneIcon, validateMarkerFile, compressMarkerFileIfNeeded, MAX_MARKER_SIZE_BYTES } from '@/lib/storage';

// Festival GeoJSON data
const festivalGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { id: 'front-gate', name: 'Front Gate / Check-In', category: 'infrastructure', icon: 'entrance', color: '#FF6B35', description: 'Main entrance and check-in area' }, geometry: { type: 'Polygon', coordinates: [[[-84.25850,42.05580],[-84.25780,42.05580],[-84.25780,42.05620],[-84.25850,42.05620],[-84.25850,42.05580]]] } },
    { type: 'Feature', properties: { id: 'powered-rv-camping', name: 'Powered RV Camping', category: 'camping', icon: 'rv', color: '#8B5CF6', description: 'Powered camping for RVs' }, geometry: { type: 'Polygon', coordinates: [[[-84.26100,42.05650],[-84.25950,42.05650],[-84.25950,42.05820],[-84.26100,42.05820],[-84.26100,42.05650]]] } },
    { type: 'Feature', properties: { id: 'vendor-row', name: 'Vendor Row', category: 'vendors', icon: 'shopping', color: '#F59E0B', description: 'Food and merchandise vendors' }, geometry: { type: 'Polygon', coordinates: [[[-84.25900,42.05750],[-84.25750,42.05750],[-84.25750,42.05850],[-84.25900,42.05850],[-84.25900,42.05750]]] } },
    { type: 'Feature', properties: { id: 'ga-camping-main', name: 'GA Camping', category: 'camping', icon: 'tent', color: '#10B981', description: 'General admission camping area' }, geometry: { type: 'Polygon', coordinates: [[[-84.25900,42.05620],[-84.25750,42.05620],[-84.25750,42.05750],[-84.25900,42.05750],[-84.25900,42.05620]]] } },
    { type: 'Feature', properties: { id: 'staff-camping', name: 'Staff Camping', category: 'staff', icon: 'restricted', color: '#6B7280', description: 'Staff camping area' }, geometry: { type: 'Polygon', coordinates: [[[-84.25720,42.05700],[-84.25580,42.05700],[-84.25580,42.05950],[-84.25650,42.05950],[-84.25720,42.05850],[-84.25720,42.05700]]] } },
    { type: 'Feature', properties: { id: 'quiet-camping', name: 'Quiet Camping', category: 'camping', icon: 'tent', color: '#3B82F6', description: 'Quiet camping zone' }, geometry: { type: 'Polygon', coordinates: [[[-84.25750,42.05900],[-84.25550,42.05900],[-84.25550,42.06050],[-84.25750,42.06050],[-84.25750,42.05900]]] } },
    { type: 'Feature', properties: { id: 'ga-camping-north', name: 'GA Camping (North)', category: 'camping', icon: 'tent', color: '#10B981', description: 'General admission camping — north field' }, geometry: { type: 'Polygon', coordinates: [[[-84.25750,42.05850],[-84.25550,42.05850],[-84.25550,42.05900],[-84.25750,42.05900],[-84.25750,42.05850]]] } },
    { type: 'Feature', properties: { id: 'the-bayou', name: 'The Bayou', category: 'stage', icon: 'stage', color: '#EF4444', description: "Katfish Esekandu's Bayou" }, geometry: { type: 'Polygon', coordinates: [[[-84.25800,42.05950],[-84.25550,42.05950],[-84.25550,42.06150],[-84.25800,42.06150],[-84.25800,42.05950]]] } },
    { type: 'Feature', properties: { id: 'artist-camping', name: 'Artist Camping', category: 'camping', icon: 'tent', color: '#A855F7', description: 'Camping area for performing artists' }, geometry: { type: 'Polygon', coordinates: [[[-84.25900,42.05920],[-84.25800,42.05920],[-84.25800,42.06050],[-84.25900,42.06050],[-84.25900,42.05920]]] } },
    { type: 'Feature', properties: { id: 'apogee', name: 'Apogee', category: 'stage', icon: 'stage', color: '#EF4444', description: 'Apogee stage' }, geometry: { type: 'Point', coordinates: [-84.25720,42.05700] } },
    { type: 'Feature', properties: { id: 'sanctuary', name: 'The Sanctuary', category: 'stage', icon: 'stage', color: '#EF4444', description: 'The Sanctuary stage' }, geometry: { type: 'Point', coordinates: [-84.25700,42.05920] } },
    { type: 'Feature', properties: { id: 'the-gallery', name: 'The Gallery', category: 'stage', icon: 'stage', color: '#EF4444', description: 'The Gallery' }, geometry: { type: 'Point', coordinates: [-84.25800,42.05950] } },
    { type: 'Feature', properties: { id: 'medical', name: 'Medical', category: 'infrastructure', icon: 'medical', color: '#DC2626', description: 'Medical and first aid station' }, geometry: { type: 'Point', coordinates: [-84.25680,42.05880] } },
    { type: 'Feature', properties: { id: 'staff-bathroom', name: 'Staff Bathroom', category: 'staff', icon: 'restroom', color: '#6B7280', description: 'Staff restroom facilities' }, geometry: { type: 'Point', coordinates: [-84.25650,42.05780] } },
    { type: 'Feature', properties: { id: 'staff-entrance', name: 'Staff Entrance', category: 'staff', icon: 'entrance', color: '#6B7280', description: 'Staff entry point' }, geometry: { type: 'Point', coordinates: [-84.25600,42.05720] } },
    { type: 'Feature', properties: { id: 'hq', name: 'HQ', category: 'staff', icon: 'building', color: '#6B7280', description: 'Festival headquarters' }, geometry: { type: 'Point', coordinates: [-84.25630,42.05810] } },
    { type: 'Feature', properties: { id: 'media-tent', name: 'Media Tent', category: 'staff', icon: 'media', color: '#6B7280', description: 'Press and media operations' }, geometry: { type: 'Point', coordinates: [-84.25650,42.05830] } },
    { type: 'Feature', properties: { id: 'artist-relations', name: 'Artist Relations', category: 'staff', icon: 'star', color: '#6B7280', description: 'Artist relations and green room area' }, geometry: { type: 'Point', coordinates: [-84.25670,42.05850] } },
    { type: 'Feature', properties: { id: 'bayou-stage', name: 'The Bayou Stage', category: 'stage', icon: 'stage', color: '#EF4444', description: 'Bayou stage marker' }, geometry: { type: 'Point', coordinates: [-84.25675,42.06050] } },
    { type: 'Feature', properties: { id: 'the-cantina', name: 'The Cantina', category: 'vendors', icon: 'food', color: '#F59E0B', description: 'The Cantina food/bar area' }, geometry: { type: 'Point', coordinates: [-84.25750,42.05800] } },
  ],
};

const CATEGORIES = ['stage', 'camping', 'infrastructure', 'staff', 'vendors', 'grounds'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  stage: '🎵 Stages',
  camping: '⛺ Camping',
  infrastructure: '🏗️ Infrastructure',
  staff: '👥 Staff',
  vendors: '🛒 Vendors',
  grounds: '🌳 Grounds',
};

function getCentroid(coords: number[][]): [number, number] {
  let x = 0, y = 0;
  const len = coords.length > 1 ? coords.length - 1 : coords.length; // skip closing coord
  for (let i = 0; i < len; i++) { x += coords[i][0]; y += coords[i][1]; }
  return [x / len, y / len];
}

// Default long-edge pixel size for an uploaded zone icon marker (before the
// per-zone size slider is touched).
const DEFAULT_ICON_SIZE = 40;

/** Ray-casting point-in-polygon test — used to keep a dragged zone icon
 * marker from being dropped outside the zone it belongs to. */
function isPointInPolygon(point: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Custom Draw styles — low-opacity fills so satellite shows through
const drawStyles = [
  // Polygon fill — inactive
  { id: 'gl-draw-polygon-fill-inactive', type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'], 'fill-outline-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'], 'fill-opacity': 0.15 }
  },
  // Polygon fill — active
  { id: 'gl-draw-polygon-fill-active', type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: { 'fill-color': '#fbb03b', 'fill-outline-color': '#fbb03b', 'fill-opacity': 0.2 }
  },
  // Polygon outline — inactive
  { id: 'gl-draw-polygon-stroke-inactive', type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'line-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'], 'line-width': 3 }
  },
  // Polygon outline — active
  { id: 'gl-draw-polygon-stroke-active', type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: { 'line-color': '#fbb03b', 'line-dasharray': [0.2, 2], 'line-width': 3 }
  },
  // Vertex points (corners you can drag)
  { id: 'gl-draw-polygon-and-line-vertex-active', type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 7, 'circle-color': '#fff', 'circle-stroke-color': '#fbb03b', 'circle-stroke-width': 2 }
  },
  // Midpoints (click to add new vertex)
  { id: 'gl-draw-polygon-midpoint', type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 5, 'circle-color': '#fbb03b', 'circle-opacity': 0.8 }
  },
  // Point features — inactive
  { id: 'gl-draw-point-inactive', type: 'circle',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 10, 'circle-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 }
  },
  // Point features — active
  { id: 'gl-draw-point-active', type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['==', 'meta', 'feature']],
    paint: { 'circle-radius': 12, 'circle-color': '#fbb03b', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 }
  },
];

// Map from Draw's internal IDs back to our feature properties
const drawIdToProps: Record<string, Record<string, unknown>> = {};

// Stage type
interface Stage {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export function MapEditorPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [cursor, setCursor] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadedFromFirestore, setLoadedFromFirestore] = useState(false);
  const [loadedFeatures, setLoadedFeatures] = useState<GeoJSON.Feature[]>([]);
  const [editingFeature, setEditingFeature] = useState<{ id: string; name: string; category: string; color: string; description: string; iconAsset?: string; iconLat?: number; iconLng?: number; showTitle: boolean; iconSize: number } | null>(null);
  const [uploadingZoneIcon, setUploadingZoneIcon] = useState(false);
  const zoneIconMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const zoneIconFileInputRef = useRef<HTMLInputElement>(null);
  // When true, the Draw control is temporarily removed from the map so
  // dragging the icon marker can't also drag the zone polygon underneath it
  // (Draw's simple_select mode grabs whatever feature is under the cursor on
  // mousedown, which was moving the whole zone instead of just the icon).
  const [iconMoveLocked, setIconMoveLocked] = useState(false);
  const [newFeatureDialog, setNewFeatureDialog] = useState<{ drawId: string; type: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [newColor, setNewColor] = useState('#FF6B35');
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stagesCollapsed, setStagesCollapsed] = useState(false);
  const [savingStages, setSavingStages] = useState(false);
  const [placingStage, setPlacingStage] = useState(false);
  const stageMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const features = festivalGeoJSON.features;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = loadedFeatures.filter((f) => f.properties?.category === cat);
    return acc;
  }, {} as Record<string, typeof features>);

  const selectFeature = useCallback((featureId: string) => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw || !map) return;

    // Find the draw ID for this feature
    const drawId = Object.keys(drawIdToProps).find(k => drawIdToProps[k]?.id === featureId);
    if (drawId) {
      draw.changeMode('simple_select', { featureIds: [drawId] });
    }
    setSelectedId(featureId);
  }, []);

  const flyTo = useCallback((feature: GeoJSON.Feature) => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map) return;
    // Use Draw's live geometry (reflects drag edits)
    let geo = feature.geometry;
    if (draw) {
      const targetId = feature.properties?.id;
      if (targetId) {
        // Find the Draw feature whose drawId maps to this property id
        const drawId = Object.keys(drawIdToProps).find(
          (k) => (drawIdToProps[k] as Record<string, unknown>)?.id === targetId
        );
        if (drawId) {
          const live = draw.get(drawId);
          if (live) geo = live.geometry;
        }
      }
    }
    let center: [number, number];
    if (geo.type === 'Point') {
      center = (geo as GeoJSON.Point).coordinates as [number, number];
    } else if (geo.type === 'Polygon') {
      center = getCentroid(((geo as GeoJSON.Polygon).coordinates)[0]);
    } else return;
    map.flyTo({ center, zoom: 17, duration: 800 });
    selectFeature(feature.properties?.id);
  }, [selectFeature]);

  const exportGeoJSON = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const all = draw.getAll();
    const exportFeatures: GeoJSON.Feature[] = all.features.map((f: GeoJSON.Feature) => {
      const props = drawIdToProps[f.id as string] || f.properties;
      return {
        type: 'Feature' as const,
        properties: {
          id: props?.id,
          name: props?.name,
          category: props?.category,
          icon: props?.icon,
          color: props?.color,
          description: props?.description,
          iconAsset: props?.iconAsset,
          iconLat: props?.iconLat,
          iconLng: props?.iconLng,
          showTitle: props?.showTitle !== false,
          iconSize: typeof props?.iconSize === 'number' ? props.iconSize : DEFAULT_ICON_SIZE,
        },
        geometry: f.geometry,
      };
    });

    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: exportFeatures,
    };

    navigator.clipboard.writeText(JSON.stringify(collection, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Update labels when Draw features change
  const updateLabels = useCallback(() => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw || !map) return;
    if (!map.getSource('labels')) return;

    const all = draw.getAll();
    const labelFeatures: GeoJSON.Feature[] = all.features
      .filter((f: GeoJSON.Feature) => (drawIdToProps[f.id as string] as Record<string, unknown> | undefined)?.showTitle !== false)
      .map((f: GeoJSON.Feature) => {
        const props = drawIdToProps[f.id as string] || {};
        let center: [number, number];
        if (f.geometry.type === 'Point') {
          center = f.geometry.coordinates as [number, number];
        } else if (f.geometry.type === 'Polygon') {
          center = getCentroid((f.geometry as GeoJSON.Polygon).coordinates[0]);
        } else {
          center = [0, 0];
        }
        return {
          type: 'Feature' as const,
          properties: { name: (props as Record<string, unknown>)?.name ?? f.id },
          geometry: { type: 'Point' as const, coordinates: center },
        };
      });

    (map.getSource('labels') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: labelFeatures,
    });
  }, []);

  const saveToFirestore = useCallback(async () => {
    const draw = drawRef.current;
    if (!draw) return;

    setSaving(true);
    try {
      const all = draw.getAll();
      const exportFeatures = all.features.map((f: GeoJSON.Feature) => {
        const props = drawIdToProps[f.id as string] || f.properties;
        return {
          type: 'Feature' as const,
          properties: {
            id: props?.id || f.id,
            name: props?.name || 'Unnamed',
            category: props?.category || 'infrastructure',
            icon: props?.icon || '',
            color: props?.color || '#888888',
            description: props?.description || '',
            iconAsset: props?.iconAsset || '',
            iconLat: props?.iconLat,
            iconLng: props?.iconLng,
            showTitle: props?.showTitle !== false,
            iconSize: typeof props?.iconSize === 'number' ? props.iconSize : DEFAULT_ICON_SIZE,
          },
          geometry: f.geometry,
        };
      });

      const collection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: exportFeatures,
      };

      await setDoc(doc(db, 'config', 'mapZones'), {
        geojson: JSON.stringify(collection),
        updatedAt: new Date().toISOString(),
        featureCount: exportFeatures.length,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save map zones:', err);
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, []);

  // --- Stage management ---
  const saveStages = useCallback(async (updatedStages: Stage[]) => {
    setSavingStages(true);
    try {
      const stagesMap: Record<string, { lat: number; lng: number; name: string; color: string }> = {};
      for (const s of updatedStages) {
        stagesMap[s.id] = { lat: s.lat, lng: s.lng, name: s.name, color: s.color };
      }
      await setDoc(doc(db, 'config', 'mapStages'), {
        stages: stagesMap,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save stages:', err);
    } finally {
      setSavingStages(false);
    }
  }, []);

  const loadStages = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'mapStages'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.stages) {
          const loaded: Stage[] = Object.entries(data.stages).map(([id, val]: [string, any]) => ({
            id,
            name: val.name,
            lat: val.lat,
            lng: val.lng,
            color: val.color,
          }));
          setStages(loaded);
        }
      }
    } catch (err) {
      console.error('Failed to load stages:', err);
    }
  }, []);

  const addStage = useCallback(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map) return;
    setPlacingStage(true);
    if (draw) {
      try { map.removeControl(draw); } catch (_) {}
    }
    map.getCanvas().style.cursor = 'crosshair';
    map.once('click', (e: mapboxgl.MapMouseEvent) => {
      const id = 'stage-' + Date.now();
      const newStage: Stage = {
        id,
        name: 'New Stage',
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        color: '#EF4444',
      };
      setStages(prev => {
        const updated = [...prev, newStage];
        saveStages(updated);
        return updated;
      });
      map.getCanvas().style.cursor = '';
      setPlacingStage(false);
      if (draw) {
        map.addControl(draw, 'top-right');
      }
    });
  }, [saveStages]);

  const updateStage = useCallback((id: string, field: keyof Stage, value: string) => {
    setStages(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, [field]: value } : s);
      saveStages(updated);
      return updated;
    });
  }, [saveStages]);

  const deleteStage = useCallback((id: string) => {
    // saveStages() does a full-document overwrite of config/mapStages, so a
    // stray click here permanently wipes it with no undo — confirm first.
    setStages(prev => {
      const target = prev.find(s => s.id === id);
      if (target && !window.confirm(`Delete stage "${target.name}"? This cannot be undone.`)) {
        return prev;
      }
      const updated = prev.filter(s => s.id !== id);
      saveStages(updated);
      return updated;
    });
  }, [saveStages]);

  const loadFromFirestore = useCallback(async (): Promise<GeoJSON.FeatureCollection | null> => {
    try {
      console.log('[MapEditor] Loading from Firestore config/mapZones...');
      const snap = await getDoc(doc(db, 'config', 'mapZones'));
      console.log('[MapEditor] Firestore snap exists:', snap.exists());
      if (snap.exists()) {
        const data = snap.data();
        console.log('[MapEditor] Firestore data keys:', Object.keys(data));
        console.log('[MapEditor] updatedAt:', data.updatedAt, 'featureCount:', data.featureCount);
        if (data.geojson) {
          const parsed = JSON.parse(data.geojson) as GeoJSON.FeatureCollection;
          console.log('[MapEditor] Parsed', parsed.features.length, 'features from Firestore');
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load map zones:', err);
    }
    console.warn('[MapEditor] Firestore load returned null — using defaults');
    return null;
  }, []);

  const confirmNewFeature = useCallback(() => {
    if (!newFeatureDialog || !newName.trim()) return;
    const { drawId } = newFeatureDialog;
    const id = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    drawIdToProps[drawId] = {
      id,
      name: newName.trim(),
      category: newCategory,
      color: newColor,
      icon: newCategory === 'stage' ? 'stage' : '',
      description: '',
    };
    // Update the Draw feature color
    const draw = drawRef.current;
    if (draw) {
      const feat = draw.get(drawId);
      if (feat) {
        feat.properties = { ...feat.properties, color: newColor };
        draw.add(feat);
      }
    }
    setNewFeatureDialog(null);
    updateLabels();
  }, [newFeatureDialog, newName, newCategory, newColor, updateLabels]);

  // Persist edits made to an already-existing zone/POI feature (name,
  // category, color, description) — previously the "Selected feature editor"
  // panel only ever displayed these fields read-only, with no way to correct
  // a miscategorized feature (e.g. a Point defaulting to 'infrastructure'
  // when drawn, even if it's really a stage) short of deleting and redrawing.
  const saveFeatureEdit = useCallback(() => {
    if (!editingFeature) return;
    const drawId = Object.keys(drawIdToProps).find(
      (k) => drawIdToProps[k]?.id === editingFeature.id
    );
    if (!drawId) return;
    drawIdToProps[drawId] = {
      ...drawIdToProps[drawId],
      name: editingFeature.name,
      category: editingFeature.category,
      color: editingFeature.color,
      description: editingFeature.description,
      iconAsset: editingFeature.iconAsset,
      iconLat: editingFeature.iconLat,
      iconLng: editingFeature.iconLng,
      showTitle: editingFeature.showTitle,
      iconSize: editingFeature.iconSize,
    };
    const draw = drawRef.current;
    if (draw) {
      const feat = draw.get(drawId);
      if (feat) {
        feat.properties = { ...feat.properties, ...drawIdToProps[drawId] };
        draw.add(feat);
      }
    }
    // The sidebar's category-grouped list reads from loadedFeatures (a
    // snapshot taken at load time), not drawIdToProps — keep it in sync so
    // the edit shows up immediately instead of only after a page reload.
    setLoadedFeatures((prev) =>
      prev.map((f) =>
        f.properties?.id === editingFeature.id
          ? {
              ...f,
              properties: {
                ...f.properties,
                name: editingFeature.name,
                category: editingFeature.category,
                color: editingFeature.color,
                description: editingFeature.description,
                iconAsset: editingFeature.iconAsset,
                iconLat: editingFeature.iconLat,
                iconLng: editingFeature.iconLng,
                showTitle: editingFeature.showTitle,
                iconSize: editingFeature.iconSize,
              },
            }
          : f
      )
    );
    updateLabels();
  }, [editingFeature, updateLabels]);

  // Uploads an icon image/SVG for the selected zone and, if it doesn't
  // already have a placed position, defaults it to the polygon's centroid so
  // it starts somewhere visible inside the shape (draggable afterward).
  const handleZoneIconUpload = useCallback(async (file: File) => {
    if (!editingFeature) return;
    const validationErr = validateMarkerFile(file);
    if (validationErr) {
      alert(validationErr);
      return;
    }
    let uploadFile = file;
    if (uploadFile.size > MAX_MARKER_SIZE_BYTES) {
      uploadFile = await compressMarkerFileIfNeeded(uploadFile);
      if (uploadFile.size > MAX_MARKER_SIZE_BYTES) {
        alert(`Image is still too large after compression (${Math.round(uploadFile.size / 1024)}KB). Try a smaller or simpler image.`);
        return;
      }
    }
    setUploadingZoneIcon(true);
    try {
      const url = await uploadZoneIcon(uploadFile, editingFeature.id);
      const drawId = Object.keys(drawIdToProps).find((k) => drawIdToProps[k]?.id === editingFeature.id);
      const zoneFeature = loadedFeatures.find((lf) => lf.properties?.id === editingFeature.id);
      const coords = zoneFeature?.geometry?.type === 'Polygon' ? zoneFeature.geometry.coordinates[0] : null;
      const centroid = coords ? getCentroid(coords) : null;
      const hasExistingPosition = editingFeature.iconLat !== undefined && editingFeature.iconLng !== undefined;
      const iconLng = hasExistingPosition ? editingFeature.iconLng : (centroid ? centroid[0] : editingFeature.iconLng);
      const iconLat = hasExistingPosition ? editingFeature.iconLat : (centroid ? centroid[1] : editingFeature.iconLat);

      // Render on the map immediately (like the drag/title-toggle behavior)
      // instead of waiting for "Save Changes" -- previously the sidebar
      // preview showed the uploaded image right away but the actual map
      // marker only appeared after a separate Save Changes click, which
      // looked like the upload silently did nothing.
      if (drawId) {
        drawIdToProps[drawId] = { ...drawIdToProps[drawId], iconAsset: url, iconLat, iconLng, iconSize: editingFeature.iconSize };
      }
      setLoadedFeatures((prev) =>
        prev.map((f) =>
          f.properties?.id === editingFeature.id
            ? { ...f, properties: { ...f.properties, iconAsset: url, iconLat, iconLng, iconSize: editingFeature.iconSize } }
            : f
        )
      );
      setEditingFeature((p) => p && { ...p, iconAsset: url, iconLat, iconLng });
    } catch (err) {
      console.error('Failed to upload zone icon:', err);
      alert('Failed to upload icon: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploadingZoneIcon(false);
      // Reset here (not immediately onChange) so the native input keeps
      // showing the picked filename while the upload is in flight instead of
      // reverting to "No file chosen" before anything visibly happened.
      if (zoneIconFileInputRef.current) zoneIconFileInputRef.current.value = '';
    }
  }, [editingFeature, loadedFeatures]);

  // Toggles whether dragging on the map moves the zone polygon (normal Draw
  // behavior) or only the icon marker on top of it. Draw's simple_select
  // mode grabs whatever feature is under the cursor on mousedown regardless
  // of what's rendered on top of it in the DOM (marker included), so a click
  // starting on the icon was also dragging the zone underneath it.
  //
  // Originally this called map.removeControl(draw)/addControl(draw) to fully
  // detach Draw, but re-adding it after a removal throws "already a source
  // with ID mapbox-gl-draw-cold" -- mapbox-gl-draw's onRemove doesn't fully
  // tear down its internal sources, so a second addControl collides with the
  // still-present ones. Toggling each Draw layer's visibility instead keeps
  // Draw fully attached (sources/lifecycle untouched, no re-add needed) while
  // making its features un-hit-testable -- Mapbox's internal click detection
  // for Draw is based on queryRenderedFeatures, which skips hidden layers.
  // A plain non-interactive GeoJSON copy of the zones fills the resulting
  // visual gap so zone shapes stay visible the whole time.
  const toggleIconMoveLock = useCallback(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;
    setIconMoveLocked((prev) => {
      const next = !prev;
      try {
        const visibility = next ? 'none' : 'visible';
        for (const style of drawStyles) {
          if (map.getLayer(style.id)) map.setLayoutProperty(style.id, 'visibility', visibility);
        }
        if (next) {
          // Note: deliberately NOT calling draw.changeMode() here -- doing
          // so fires a selectionchange with an empty feature list, which
          // clears editingFeature and immediately triggers the safety-net
          // effect below to auto-unlock. Hiding the layers alone is enough
          // to stop hit-testing, so the current selection can stay intact.
          if (!map.getSource('zones-lock-preview')) {
            const snapshot = draw.getAll();
            map.addSource('zones-lock-preview', { type: 'geojson', data: snapshot });
            map.addLayer({
              id: 'zones-lock-preview-fill',
              type: 'fill',
              source: 'zones-lock-preview',
              filter: ['==', '$type', 'Polygon'],
              paint: { 'fill-color': ['coalesce', ['get', 'color'], '#3bb2d0'], 'fill-opacity': 0.15 },
            });
            map.addLayer({
              id: 'zones-lock-preview-line',
              type: 'line',
              source: 'zones-lock-preview',
              filter: ['==', '$type', 'Polygon'],
              paint: { 'line-color': ['coalesce', ['get', 'color'], '#3bb2d0'], 'line-width': 2 },
            });
          }
        } else {
          if (map.getLayer('zones-lock-preview-fill')) map.removeLayer('zones-lock-preview-fill');
          if (map.getLayer('zones-lock-preview-line')) map.removeLayer('zones-lock-preview-line');
          if (map.getSource('zones-lock-preview')) map.removeSource('zones-lock-preview');
        }
      } catch (err) {
        console.error('Failed to toggle icon-move lock:', err);
      }
      return next;
    });
  }, []);

  // Safety net: never leave Draw's layers hidden if the selection is cleared
  // while locked (e.g. user clicks elsewhere) -- there'd be no way to unlock
  // via the (now-hidden, no editingFeature) button otherwise.
  useEffect(() => {
    if (!editingFeature && iconMoveLocked) {
      const map = mapRef.current;
      if (map) {
        try {
          for (const style of drawStyles) {
            if (map.getLayer(style.id)) map.setLayoutProperty(style.id, 'visibility', 'visible');
          }
          if (map.getLayer('zones-lock-preview-fill')) map.removeLayer('zones-lock-preview-fill');
          if (map.getLayer('zones-lock-preview-line')) map.removeLayer('zones-lock-preview-line');
          if (map.getSource('zones-lock-preview')) map.removeSource('zones-lock-preview');
        } catch (_) { /* already visible / already removed */ }
      }
      setIconMoveLocked(false);
    }
  }, [editingFeature, iconMoveLocked]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error('VITE_MAPBOX_TOKEN not set — add it to admin/.env');
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-84.2565, 42.0567],
      zoom: 15.5,
    });

    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      // Required for drawStyles' `['get', 'user_color']` expressions to see
      // our custom `color` property at all -- without this, Draw never
      // exposes non-builtin properties to the GL style layer, so every zone
      // silently rendered with the hardcoded '#3bb2d0' fallback instead of
      // its real stored color.
      userProperties: true,
      controls: {
        // Point marker creation is retired — POIManager (mapPOIs collection)
        // is now the only path for markers, so they actually reach the
        // mobile app instead of being invisible zone-doc Points (see
        // MEMORY known-issues: the POI architecture migration).
        polygon: true,
        point: false,
        trash: true,
      },
      styles: drawStyles,
    });
    drawRef.current = draw;
    map.addControl(draw, 'top-right');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      setCursor({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    // POI placement uses map.once('click') via onRequestMapClick — no persistent handler needed here

    map.on('draw.selectionchange', (e: { features: GeoJSON.Feature[] }) => {
      if (e.features.length > 0) {
        const f = e.features[0];
        const props = drawIdToProps[f.id as string];
        if (props) {
          setSelectedId(props.id as string);
          setEditingFeature({
            id: props.id as string,
            name: props.name as string,
            category: props.category as string,
            color: props.color as string,
            description: (props.description as string) || '',
            iconAsset: (props.iconAsset as string) || undefined,
            iconLat: props.iconLat as number | undefined,
            iconLng: props.iconLng as number | undefined,
            showTitle: props.showTitle !== false,
            iconSize: typeof props.iconSize === 'number' ? props.iconSize : DEFAULT_ICON_SIZE,
          });
        }
      } else {
        setSelectedId(null);
        setEditingFeature(null);
      }
    });

    map.on('draw.update', () => {
      updateLabels();
    });

    map.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
      // Only polygon zones can be drawn now (point control is disabled above).
      if (e.features.length > 0) {
        const f = e.features[0];
        const drawId = f.id as string;
        setNewFeatureDialog({ drawId, type: f.geometry.type });
        setNewName('');
        setNewCategory('camping');
        setNewColor('#10B981');
      }
    });

    map.on('load', async () => {
      // Load stages
      loadStages();
      // Try loading from Firestore first
      const firestoreData = await loadFromFirestore();
      const featuresToLoad = firestoreData ? firestoreData.features : features;
      if (firestoreData) {
        setLoadedFromFirestore(true);
        setLoadedFeatures(firestoreData.features);
        console.log('[MapEditor] Loaded', firestoreData.features.length, 'features from Firestore');
        console.log('[MapEditor] First feature coords:', JSON.stringify(firestoreData.features[0]?.geometry?.coordinates?.[0]?.[0] || firestoreData.features[0]?.geometry?.coordinates));
      } else {
        console.log('[MapEditor] Using hardcoded defaults');
        setLoadedFeatures(features);
      }

      // Add ALL features (both polygons and points) to Draw so they're all draggable
      for (const f of featuresToLoad) {
        const drawFeature = {
          type: 'Feature' as const,
          properties: {
            // Store color so Draw styles can use it
            color: f.properties?.color,
          },
          geometry: f.geometry,
        };
        const ids = draw.add(drawFeature);
        if (ids && ids[0]) {
          drawIdToProps[ids[0]] = { ...f.properties };
        }
      }

      // Add label layer (skips zones with showTitle explicitly set to false —
      // those show only their icon on the map, per the per-zone toggle).
      const labelFeatures: GeoJSON.Feature[] = featuresToLoad
        .filter((f) => f.properties?.showTitle !== false)
        .map((f) => {
          let center: [number, number];
          if (f.geometry.type === 'Point') {
            center = f.geometry.coordinates as [number, number];
          } else if (f.geometry.type === 'Polygon') {
            center = getCentroid((f.geometry as GeoJSON.Polygon).coordinates[0]);
          } else {
            center = [0, 0];
          }
          return {
            type: 'Feature' as const,
            properties: { name: f.properties?.name ?? '' },
            geometry: { type: 'Point' as const, coordinates: center },
          };
        });

      map.addSource('labels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: labelFeatures },
      });

      map.addLayer({
        id: 'labels-layer',
        type: 'symbol',
        source: 'labels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 16,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-offset': [0, -1.2],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render stage markers on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear old stage markers
    stageMarkersRef.current.forEach(m => m.remove());
    stageMarkersRef.current = [];
    for (const stage of stages) {
      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '6px';
      el.style.backgroundColor = stage.color;
      el.style.border = '3px solid white';
      el.style.cursor = 'grab';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '16px';
      el.innerHTML = '🎵';
      el.title = stage.name;
      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([stage.lng, stage.lat])
        .addTo(map);
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setStages(prev => {
          const updated = prev.map(s =>
            s.id === stage.id ? { ...s, lat: lngLat.lat, lng: lngLat.lng } : s
          );
          saveStages(updated);
          return updated;
        });
      });
      stageMarkersRef.current.push(marker);
    }
  }, [stages, saveStages]);

  // Render POI markers on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear old markers
    poiMarkersRef.current.forEach(m => m.remove());
    poiMarkersRef.current = [];
    // Add new markers
    for (const poi of pois) {
      const el = document.createElement('div');
      const isSelected = poi.id === selectedPOIId;
      const size = isSelected ? 26 : 20;
      const assetUrl = getImageDisplayUrl(poi.markerAsset);
      if (assetUrl) {
        // Custom uploaded icon (image/SVG) replaces the plain color circle —
        // matches what mobile actually renders, so admin previews the truth.
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '6px';
        el.style.border = isSelected ? '3px solid #6BBF59' : '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
        el.style.backgroundColor = '#1C2B20';
        el.style.overflow = 'hidden';
        el.style.cursor = 'pointer';
        const img = document.createElement('img');
        img.src = assetUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        el.appendChild(img);
      } else {
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = poi.color;
        el.style.border = isSelected ? '3px solid #6BBF59' : '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
      }
      el.title = poi.name;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPOIId(poi.id);
      });
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);
      poiMarkersRef.current.push(marker);
    }
  }, [pois, selectedPOIId]);

  // Render draggable icon markers for zones that have an uploaded icon asset.
  // Position defaults to the polygon centroid (set at upload time in
  // handleZoneIconUpload) and can be repositioned anywhere within the zone by
  // dragging. Rendered as the raw image at its own aspect ratio (no border/
  // background box) so transparency and proportions match the uploaded file
  // exactly; iconSize controls the long-edge pixel size via the size slider.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    zoneIconMarkersRef.current.forEach(m => m.remove());
    zoneIconMarkersRef.current = [];
    for (const f of loadedFeatures) {
      const props = f.properties as Record<string, unknown> | undefined;
      const iconAsset = props?.iconAsset as string | undefined;
      if (!iconAsset) continue;
      const assetUrl = getImageDisplayUrl(iconAsset);
      if (!assetUrl) continue;
      const lat = props?.iconLat as number | undefined;
      const lng = props?.iconLng as number | undefined;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const targetSize = typeof props?.iconSize === 'number' ? props.iconSize : DEFAULT_ICON_SIZE;

      const img = document.createElement('img');
      img.src = assetUrl;
      img.draggable = false;
      img.style.display = 'block';
      img.style.cursor = 'grab';
      img.style.filter = 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))';
      img.title = `${props?.name ?? ''} icon (drag to reposition)`;
      // Assume square until onload reports the real ratio, so there's no
      // flash of a full-resolution image before it gets sized down.
      img.style.width = `${targetSize}px`;
      img.style.height = `${targetSize}px`;
      // Size to the image's own aspect ratio once known, instead of forcing
      // it into a fixed square box (which either distorted or letterboxed
      // non-square logos).
      img.onload = () => {
        const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        if (ratio >= 1) {
          img.style.width = `${targetSize}px`;
          img.style.height = `${targetSize / ratio}px`;
        } else {
          img.style.height = `${targetSize}px`;
          img.style.width = `${targetSize * ratio}px`;
        }
      };

      const zoneId = props?.id as string;
      const drawId = Object.keys(drawIdToProps).find((k) => drawIdToProps[k]?.id === zoneId);
      const marker = new mapboxgl.Marker({ element: img, draggable: true })
        .setLngLat([lng as number, lat as number])
        .addTo(map);
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        // Read the polygon ring from React state (loadedFeatures), not
        // draw.get() -- Draw is detached while the icon-move lock is on
        // (that's the whole point of the lock), and calling into its API
        // after removeControl() throws internally instead of just no-op'ing.
        const zoneFeature = loadedFeatures.find((lf) => lf.properties?.id === zoneId);
        const ring = zoneFeature?.geometry?.type === 'Polygon' ? zoneFeature.geometry.coordinates[0] : null;
        if (ring && !isPointInPolygon([newLngLat.lng, newLngLat.lat], ring)) {
          // Dropped outside the zone -- snap back rather than let the icon
          // wander off the area it belongs to.
          marker.setLngLat([lng as number, lat as number]);
          return;
        }
        if (drawId) {
          drawIdToProps[drawId] = { ...drawIdToProps[drawId], iconLat: newLngLat.lat, iconLng: newLngLat.lng };
        }
        setLoadedFeatures((prev) =>
          prev.map((feat) =>
            feat.properties?.id === zoneId
              ? { ...feat, properties: { ...feat.properties, iconLat: newLngLat.lat, iconLng: newLngLat.lng } }
              : feat
          )
        );
        if (editingFeature?.id === zoneId) {
          setEditingFeature((p) => p && { ...p, iconLat: newLngLat.lat, iconLng: newLngLat.lng });
        }
      });
      zoneIconMarkersRef.current.push(marker);
    }
  }, [loadedFeatures, editingFeature?.id]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar panel */}
      <div className="w-[320px] shrink-0 bg-[#1C2B20] border-r border-[#F5F5DC]/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#F5F5DC]/10">
          <h2 className="text-xl font-bold text-[#F5F5DC]">🗺️ Map Editor</h2>
          <p className="text-sm text-[#F5F5DC]/60 mt-1">
            Click to select • Drag to move • Click midpoints to add vertices
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {CATEGORIES.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <div className="text-sm font-bold text-[#F5F5DC]/60 uppercase tracking-wider px-2 py-1 mb-1">
                  {CATEGORY_LABELS[cat]}
                </div>
                {items.map((f) => {
                  const props = f.properties!;
                  const isSelected = selectedId === props.id;
                  return (
                    <button
                      key={props.id}
                      onClick={() => flyTo(f)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-left transition-colors ${
                        isSelected
                          ? 'bg-[#6BBF59]/25 text-[#6BBF59] ring-1 ring-[#6BBF59]/40'
                          : 'text-[#F5F5DC]/80 hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`shrink-0 ${f.geometry.type === 'Point' ? 'w-4 h-4 rounded-full border-2 border-white/60' : 'w-4 h-4 rounded-sm'}`}
                        style={{ backgroundColor: props.color }}
                      />
                      <span className="truncate font-medium">{props.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selected feature editor */}
        {editingFeature && (
          <div className="p-3 border-t border-[#F5F5DC]/10 bg-[#2E4031]/50 space-y-2">
            <div className="text-sm font-bold text-[#F5F5DC]">Edit selected feature</div>
            <input
              type="text"
              value={editingFeature.name}
              onChange={(e) => setEditingFeature((p) => p && { ...p, name: e.target.value })}
              placeholder="Name"
              className="w-full px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm placeholder:text-[#F5F5DC]/30 focus:outline-none focus:ring-1 focus:ring-[#6BBF59]/50"
            />
            <div className="flex gap-2">
              <select
                value={editingFeature.category}
                onChange={(e) => setEditingFeature((p) => p && { ...p, category: e.target.value })}
                className="flex-1 px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm focus:outline-none"
              >
                <option value="stage">🎵 Stage</option>
                <option value="camping">⛺ Camping</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
                <option value="staff">👥 Staff</option>
                <option value="vendors">🛒 Vendors</option>
                <option value="grounds">🌳 Grounds</option>
              </select>
              <input
                type="color"
                value={editingFeature.color}
                onChange={(e) => setEditingFeature((p) => p && { ...p, color: e.target.value })}
                className="w-10 h-8 rounded border border-[#F5F5DC]/20 bg-[#1C2B20] cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={editingFeature.description}
              onChange={(e) => setEditingFeature((p) => p && { ...p, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm placeholder:text-[#F5F5DC]/30 focus:outline-none"
            />
            <div className="space-y-1.5">
              <label className="text-xs text-[#F5F5DC]/50">Icon image/SVG (optional — drag on map to position)</label>
              <div className="flex items-center gap-2">
                {editingFeature.iconAsset && (
                  <img
                    src={getImageDisplayUrl(editingFeature.iconAsset) || undefined}
                    alt="zone icon preview"
                    className="w-9 h-9 rounded border border-[#F5F5DC]/20 bg-[#1C2B20] object-contain"
                  />
                )}
                <input
                  ref={zoneIconFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleZoneIconUpload(file);
                  }}
                  disabled={uploadingZoneIcon}
                  className="flex-1 text-xs text-[#F5F5DC]/60 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-[#6BBF59]/20 file:text-[#6BBF59] file:text-xs"
                />
                {uploadingZoneIcon && (
                  <span className="flex items-center gap-1 text-xs text-[#6BBF59] shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </span>
                )}
                {editingFeature.iconAsset && !uploadingZoneIcon && (
                  <button
                    onClick={() => {
                      // Applies immediately, same as the upload path above --
                      // otherwise the marker would linger on the map until
                      // Save Changes despite the sidebar preview already
                      // being cleared.
                      const drawId = Object.keys(drawIdToProps).find((k) => drawIdToProps[k]?.id === editingFeature.id);
                      if (drawId) {
                        drawIdToProps[drawId] = { ...drawIdToProps[drawId], iconAsset: undefined, iconLat: undefined, iconLng: undefined, showTitle: true };
                      }
                      setLoadedFeatures((prev) =>
                        prev.map((f) =>
                          f.properties?.id === editingFeature.id
                            ? { ...f, properties: { ...f.properties, iconAsset: undefined, iconLat: undefined, iconLng: undefined, showTitle: true } }
                            : f
                        )
                      );
                      setEditingFeature((p) => p && { ...p, iconAsset: undefined, iconLat: undefined, iconLng: undefined, showTitle: true });
                    }}
                    className="text-xs text-red-400 hover:text-red-300 shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
              {editingFeature.iconAsset && (
                <label className="flex items-center gap-2 text-xs text-[#F5F5DC]/60 pt-1">
                  <input
                    type="checkbox"
                    checked={editingFeature.showTitle}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      // Applies immediately (like dragging the icon marker)
                      // rather than waiting on "Save Changes" -- a visibility
                      // toggle reads as an instant preview, not a staged edit.
                      const drawId = Object.keys(drawIdToProps).find((k) => drawIdToProps[k]?.id === editingFeature.id);
                      if (drawId) {
                        drawIdToProps[drawId] = { ...drawIdToProps[drawId], showTitle: checked };
                      }
                      setLoadedFeatures((prev) =>
                        prev.map((f) =>
                          f.properties?.id === editingFeature.id
                            ? { ...f, properties: { ...f.properties, showTitle: checked } }
                            : f
                        )
                      );
                      setEditingFeature((p) => p && { ...p, showTitle: checked });
                      updateLabels();
                    }}
                    className="accent-[#6BBF59]"
                  />
                  Show zone title on map (uncheck to show only the icon)
                </label>
              )}
              {editingFeature.iconAsset && (
                <div className="pt-1">
                  <label className="text-xs text-[#F5F5DC]/60 flex justify-between">
                    <span>Icon size</span>
                    <span>{editingFeature.iconSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={16}
                    max={300}
                    step={4}
                    value={editingFeature.iconSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      // Applies immediately, same as the title toggle/drag —
                      // a size slider is expected to preview live.
                      const drawId = Object.keys(drawIdToProps).find((k) => drawIdToProps[k]?.id === editingFeature.id);
                      if (drawId) {
                        drawIdToProps[drawId] = { ...drawIdToProps[drawId], iconSize: size };
                      }
                      setLoadedFeatures((prev) =>
                        prev.map((f) =>
                          f.properties?.id === editingFeature.id
                            ? { ...f, properties: { ...f.properties, iconSize: size } }
                            : f
                        )
                      );
                      setEditingFeature((p) => p && { ...p, iconSize: size });
                    }}
                    className="w-full accent-[#6BBF59]"
                  />
                  <button
                    onClick={toggleIconMoveLock}
                    className={`w-full mt-2 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      iconMoveLocked
                        ? 'bg-[#6BBF59] text-[#1C2B20]'
                        : 'bg-[#1C2B20] text-[#F5F5DC]/70 border border-[#F5F5DC]/20 hover:bg-white/5'
                    }`}
                  >
                    {iconMoveLocked ? '🔒 Locked — dragging moves the icon only' : '🔓 Lock: drag icon only, not the zone'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={saveFeatureEdit}
              className="w-full px-3 py-2 rounded bg-[#6BBF59] text-[#1C2B20] font-bold text-sm hover:bg-[#6BBF59]/90"
            >
              Save Changes
            </button>
            <div className="text-[10px] text-[#F5F5DC]/40">
              Click "Save Map" below to persist this change.
            </div>
          </div>
        )}

        {/* Stage Manager */}
        <div className="border-t border-[#F5F5DC]/10">
          <button
            onClick={() => setStagesCollapsed(!stagesCollapsed)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-bold text-[#F5F5DC]/80 hover:bg-white/5"
          >
            {stagesCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Music className="h-4 w-4" />
            Stages ({stages.length})
            {savingStages && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
          </button>
          {!stagesCollapsed && (
            <div className="px-3 pb-3 space-y-2">
              {stages.map(stage => (
                <div key={stage.id} className="bg-[#2E4031]/50 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stage.color}
                      onChange={e => updateStage(stage.id, 'color', e.target.value)}
                      className="w-6 h-6 rounded border border-[#F5F5DC]/20 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={stage.name}
                      onChange={e => updateStage(stage.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-[#1C2B20] border border-[#F5F5DC]/10 text-[#F5F5DC] text-sm focus:outline-none focus:ring-1 focus:ring-[#6BBF59]/50"
                    />
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="text-red-400/60 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-[#F5F5DC]/40 font-mono px-1">
                    {stage.lat.toFixed(6)}, {stage.lng.toFixed(6)}
                  </div>
                </div>
              ))}
              <button
                onClick={addStage}
                disabled={placingStage}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#F5F5DC]/20 text-[#F5F5DC]/60 text-sm hover:bg-white/5 hover:text-[#F5F5DC]/80 disabled:opacity-50"
              >
                {placingStage ? (
                  <>Click map to place stage...</>
                ) : (
                  <><Plus className="h-3.5 w-3.5" /> Add Stage</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* POI Manager */}
        <POIManager
          onPOIsChanged={useCallback((newPois: POI[]) => { setPois(newPois); }, [])}
          onRequestMapClick={useCallback((cb: (lat: number, lng: number) => void) => {
            // Remove draw control temporarily so clicks pass through
            const draw = drawRef.current;
            const map = mapRef.current;
            if (!map) return;
            if (draw) {
              try { map.removeControl(draw); } catch (_) {}
            }
            map.getCanvas().style.cursor = 'crosshair';
            map.once('click', (e: mapboxgl.MapMouseEvent) => {
              cb(e.lngLat.lat, e.lngLat.lng);
              map.getCanvas().style.cursor = '';
              // Re-add draw control
              if (draw) {
                map.addControl(draw, 'top-right');
              }
            });
          }, [])}
          selectedPOIId={selectedPOIId}
          onSelectPOI={useCallback((id: string | null) => {
            setSelectedPOIId(id);
            if (id && mapRef.current) {
              const poi = pois.find(p => p.id === id);
              if (poi) mapRef.current.flyTo({ center: [poi.lng, poi.lat], zoom: 17, duration: 800 });
            }
          }, [pois])}
        />

        {/* Action buttons */}
        <div className="p-3 border-t border-[#F5F5DC]/10 space-y-2">
          <button
            onClick={saveToFirestore}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-[#6BBF59] text-[#1C2B20] font-bold text-base hover:bg-[#6BBF59]/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Save className="h-5 w-5" /> Saved!</>
            ) : (
              <><Save className="h-5 w-5" /> Save Map</>
            )}
          </button>
          <button
            onClick={exportGeoJSON}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2E4031] text-[#F5F5DC]/80 font-medium text-sm hover:bg-[#2E4031]/80 border border-[#F5F5DC]/10 transition-colors"
          >
            {copied ? (
              <><Copy className="h-4 w-4" /> Copied!</>
            ) : (
              <><Download className="h-4 w-4" /> Export GeoJSON</>
            )}
          </button>
          {loadedFromFirestore && (
            <div className="text-xs text-[#6BBF59]/60 text-center">Loaded from saved data</div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Instructions overlay */}
        <div className="absolute top-3 left-3 bg-[#1C2B20]/90 text-[#F5F5DC] text-sm px-4 py-2.5 rounded-lg backdrop-blur-sm space-y-1 max-w-xs">
          <div className="font-bold">✏️ Drawing Tools (zones only)</div>
          <div className="text-xs text-[#F5F5DC]/70">
            <strong>✏️ Polygon tool</strong> (top-right) — click points to draw outline, double-click to finish<br/>
            <strong>🗑️ Trash</strong> — select + delete<br/>
            <strong>Click</strong> existing zone to select & drag<br/>
            <strong>Drag corners</strong> to reshape<br/>
            <strong>Click midpoints</strong> (orange dots) to add vertices<br/>
            <strong>Need a marker?</strong> Use "Add" under POIs below, not the Draw tool
          </div>
        </div>

        {/* Coordinate display */}
        {cursor && (
          <div className="absolute bottom-3 left-3 bg-[#1C2B20]/90 text-[#F5F5DC]/80 text-sm px-3 py-2 rounded-lg flex items-center gap-2 font-mono backdrop-blur-sm">
            <MousePointer className="h-4 w-4" />
            {cursor.lat.toFixed(6)}, {cursor.lng.toFixed(6)}
          </div>
        )}
      </div>

      {/* New Feature Dialog */}
      {newFeatureDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1C2B20] border border-[#F5F5DC]/20 rounded-xl p-6 w-[360px] space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#F5F5DC]">✏️ New Zone</h3>
            <div>
              <label className="text-sm text-[#F5F5DC]/60 block mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. The Bayou Stage, Water Station..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-[#2E4031] border border-[#F5F5DC]/20 text-[#F5F5DC] text-base placeholder:text-[#F5F5DC]/30 focus:outline-none focus:ring-2 focus:ring-[#6BBF59]/50"
                onKeyDown={(e) => { if (e.key === 'Enter') confirmNewFeature(); }}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-[#F5F5DC]/60 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#2E4031] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm focus:outline-none focus:ring-2 focus:ring-[#6BBF59]/50"
                >
                  <option value="camping">⛺ Camping</option>
                  <option value="infrastructure">🏗️ Infrastructure</option>
                  <option value="staff">👥 Staff</option>
                  <option value="vendors">🛒 Vendors</option>
                  <option value="grounds">🌳 Grounds</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[#F5F5DC]/60 block mb-1">Color</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-[#F5F5DC]/20 bg-[#2E4031] cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  // Delete the drawn feature if cancelled
                  const draw = drawRef.current;
                  if (draw && newFeatureDialog.drawId) {
                    draw.delete(newFeatureDialog.drawId);
                  }
                  setNewFeatureDialog(null);
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-[#F5F5DC]/20 text-[#F5F5DC]/60 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewFeature}
                disabled={!newName.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-[#6BBF59] text-[#1C2B20] font-bold text-sm hover:bg-[#6BBF59]/90 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
