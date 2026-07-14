import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
// @ts-expect-error mapbox-gl-draw has no types
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Copy, Download, MousePointer, Save, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { POIManager, POI } from '@/components/POIManager';

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

const CATEGORIES = ['stage', 'camping', 'infrastructure', 'staff', 'vendors'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  stage: '🎵 Stages',
  camping: '⛺ Camping',
  infrastructure: '🏗️ Infrastructure',
  staff: '👥 Staff',
  vendors: '🛒 Vendors',
};

function getCentroid(coords: number[][]): [number, number] {
  let x = 0, y = 0;
  const len = coords.length > 1 ? coords.length - 1 : coords.length; // skip closing coord
  for (let i = 0; i < len; i++) { x += coords[i][0]; y += coords[i][1]; }
  return [x / len, y / len];
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
  const [editingFeature, setEditingFeature] = useState<{ id: string; name: string; category: string; color: string; description: string } | null>(null);
  const [newFeatureDialog, setNewFeatureDialog] = useState<{ drawId: string; type: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [newColor, setNewColor] = useState('#FF6B35');
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const features = festivalGeoJSON.features;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = features.filter((f) => f.properties?.category === cat);
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
    if (!map) return;
    let center: [number, number];
    if (feature.geometry.type === 'Point') {
      center = feature.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'Polygon') {
      center = getCentroid((feature.geometry as GeoJSON.Polygon).coordinates[0]);
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
    const labelFeatures: GeoJSON.Feature[] = all.features.map((f: GeoJSON.Feature) => {
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

  const loadFromFirestore = useCallback(async (): Promise<GeoJSON.FeatureCollection | null> => {
    try {
      const snap = await getDoc(doc(db, 'config', 'mapZones'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.geojson) {
          return JSON.parse(data.geojson) as GeoJSON.FeatureCollection;
        }
      }
    } catch (err) {
      console.error('Failed to load map zones:', err);
    }
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
      controls: {
        polygon: true,
        point: true,
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
      if (e.features.length > 0) {
        const f = e.features[0];
        const drawId = f.id as string;
        const geoType = f.geometry.type;
        setNewFeatureDialog({ drawId, type: geoType });
        setNewName('');
        setNewCategory(geoType === 'Point' ? 'infrastructure' : 'camping');
        setNewColor(geoType === 'Point' ? '#FF6B35' : '#10B981');
      }
    });

    map.on('load', async () => {
      // Try loading from Firestore first
      const firestoreData = await loadFromFirestore();
      const featuresToLoad = firestoreData ? firestoreData.features : features;
      if (firestoreData) setLoadedFromFirestore(true);

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

      // Add label layer
      const labelFeatures: GeoJSON.Feature[] = featuresToLoad.map((f) => {
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
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = poi.color;
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
      if (poi.id === selectedPOIId) {
        el.style.width = '26px';
        el.style.height = '26px';
        el.style.border = '3px solid #6BBF59';
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
            <div className="text-sm font-bold text-[#F5F5DC]">
              Editing: {editingFeature.name}
            </div>
            <div className="text-xs text-[#F5F5DC]/50">
              Category: {editingFeature.category} • Color: {editingFeature.color}
            </div>
            <div className="text-xs text-[#F5F5DC]/40 mt-1">
              {editingFeature.description}
            </div>
          </div>
        )}

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
          <div className="font-bold">✏️ Drawing Tools</div>
          <div className="text-xs text-[#F5F5DC]/70">
            <strong>✏️ Polygon tool</strong> (top-right) — click points to draw outline, double-click to finish<br/>
            <strong>📍 Point tool</strong> — click to place a POI marker<br/>
            <strong>🗑️ Trash</strong> — select + delete<br/>
            <strong>Click</strong> existing zone to select & drag<br/>
            <strong>Drag corners</strong> to reshape<br/>
            <strong>Click midpoints</strong> (orange dots) to add vertices
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
            <h3 className="text-lg font-bold text-[#F5F5DC]">
              {newFeatureDialog.type === 'Point' ? '📍 New POI' : '✏️ New Zone'}
            </h3>
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
                  <option value="stage">🎵 Stage</option>
                  <option value="camping">⛺ Camping</option>
                  <option value="infrastructure">🏗️ Infrastructure</option>
                  <option value="staff">👥 Staff</option>
                  <option value="vendors">🛒 Vendors</option>
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
