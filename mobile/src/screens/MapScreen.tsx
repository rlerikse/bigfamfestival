import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TopNavBar from '../components/TopNavBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import * as Location from 'expo-location';

const FESTIVAL_CENTER: [number, number] = [-84.2575, 42.0577];
const DEFAULT_ZOOM = 16;

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
  const [zones, setZones] = useState<MapZone[]>([]);
  const [pois, setPois] = useState<MapPOI[]>([]);
  const [stages, setStages] = useState<StageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<(MapPOI | StageLocation) | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // All categories visible by default
  const [visibleCategories, setVisibleCategories] = useState<Set<POICategory>>(
    new Set(Object.keys(POI_CATEGORIES) as POICategory[])
  );
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

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

  // ─── Derived ─────────────────────────────────────────────────────────────

  const stagesVisible = visibleCategories.has('stage');

  const filteredPOIs = pois.filter(poi => {
    const cat = resolveCategory(poi.category);
    return visibleCategories.has(cat);
  });

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
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        compassEnabled={false}
        logoEnabled={true}
        attributionEnabled={true}
        attributionPosition={{ bottom: 80, left: 8 }}
        logoPosition={{ bottom: 80, left: 8 }}
        onCameraChanged={(state) => {
          if (state?.properties?.zoom != null) {
            setCurrentZoom(state.properties.zoom);
          }
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: FESTIVAL_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
        />

        {/* User location */}
        <Mapbox.LocationPuck
          puckBearingEnabled
          puckBearing="heading"
          pulsing={{ isEnabled: true, color: '#6BBF59', radius: 40 }}
        />

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
      </Mapbox.MapView>

      {/* Top NavBar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <TopNavBar showSearchBar={false} whiteIcons />
      </View>

      {/* Map Controls — right side */}
      <View style={[styles.mapControls, { top: insets.top + 110 }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => cameraRef.current?.setCamera({ heading: 0, animationDuration: 300 })}
          activeOpacity={0.7}
        >
          <Ionicons name="compass-outline" size={24} color="#F5F5DC" />
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
      </View>

      {/* Filter / Legend toggle button */}
      <TouchableOpacity
        style={[styles.legendToggleButton, { top: insets.top + 110 }]}
        onPress={() => setLegendOpen(v => !v)}
        activeOpacity={0.85}
      >
        <Ionicons name={legendOpen ? 'layers' : 'layers-outline'} size={22} color="#F5F5DC" />
      </TouchableOpacity>

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
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setSelectedPOI(null)}
            activeOpacity={0.9}
          >
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
          </TouchableOpacity>
        );
      })()}
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

  // ── Map Controls ──────────────────────────────────────────────────────────
  mapControls: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
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

  // ── Legend toggle ─────────────────────────────────────────────────────────
  legendToggleButton: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 43, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Legend panel ──────────────────────────────────────────────────────────
  legendPanel: {
    position: 'absolute',
    left: 12,
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
});
