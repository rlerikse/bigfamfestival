import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TopNavBar from '../components/TopNavBar';
import { useTheme } from '../contexts/ThemeContext';
import { firestore } from '../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const FESTIVAL_CENTER: [number, number] = [-84.2565, 42.0567];
const DEFAULT_ZOOM = 15;

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

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', emoji: '📍' },
  { key: 'stage', label: 'Stages', emoji: '🎵' },
  { key: 'camping', label: 'Camping', emoji: '⛺' },
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'medical', label: 'Medical', emoji: '🏥' },
  { key: 'info', label: 'Info', emoji: 'ℹ️' },
  { key: 'water', label: 'Water', emoji: '💧' },
  { key: 'bathrooms', label: 'Restrooms', emoji: '🚻' },
  { key: 'vendors', label: 'Vendors', emoji: '🛒' },
];

export default function MapScreen() {
  const { isDark } = useTheme();
  const [zones, setZones] = useState<MapZone[]>([]);
  const [pois, setPois] = useState<MapPOI[]>([]);
  const [stages, setStages] = useState<StageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPOI, setSelectedPOI] = useState<(MapPOI | StageLocation) | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      // Load zones from config/mapZones
      const zonesSnap = await getDoc(doc(firestore, 'config', 'mapZones'));
      if (zonesSnap.exists()) {
        const data = zonesSnap.data();
        if (data.geojson) {
          const parsed = JSON.parse(data.geojson);
          setZones(parsed.features || []);
        }
      }

      // Load POIs from mapPOIs collection
      const poisSnap = await getDocs(collection(firestore, 'mapPOIs'));
      const poiList: MapPOI[] = poisSnap.docs.map(d => ({ id: d.id, ...d.data() } as MapPOI));
      setPois(poiList);

      // Load stages from config/mapStages
      const stagesSnap = await getDoc(doc(firestore, 'config', 'mapStages'));
      if (stagesSnap.exists()) {
        const data = stagesSnap.data();
        if (data.stages) {
          const stageList: StageLocation[] = Object.values(data.stages);
          setStages(stageList);
        }
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build GeoJSON for polygon zones
  const zoneGeoJSON = {
    type: 'FeatureCollection' as const,
    features: zones.filter(z => z.geometry.type === 'Polygon'),
  };

  // Filter POIs by active category
  const filteredPOIs = activeFilter === 'all'
    ? pois
    : pois.filter(p => p.category === activeFilter);

  const filteredStages = activeFilter === 'all' || activeFilter === 'stage'
    ? stages
    : [];

  const handlePOIPress = useCallback((poi: MapPOI | StageLocation) => {
    setSelectedPOI(prev => prev === poi ? null : poi);
  }, []);

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
      {/* Map extends to top of screen */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        compassEnabled={true}
        logoEnabled={true}
        attributionEnabled={true}
      >
          <Mapbox.Camera
            defaultSettings={{
              centerCoordinate: FESTIVAL_CENTER,
              zoomLevel: DEFAULT_ZOOM,
            }}
          />

          {/* Zone polygons */}
          {zoneGeoJSON.features.length > 0 && (
            <Mapbox.ShapeSource id="zones" shape={zoneGeoJSON as GeoJSON.FeatureCollection}>
              <Mapbox.FillLayer
                id="zone-fills"
                style={{
                  fillColor: ['get', 'color'],
                  fillOpacity: 0.25,
                }}
              />
              <Mapbox.LineLayer
                id="zone-outlines"
                style={{
                  lineColor: ['get', 'color'],
                  lineWidth: 2,
                }}
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
          {filteredStages.map(stage => (
            <Mapbox.PointAnnotation
              key={stage.name}
              id={`stage-${stage.name}`}
              coordinate={[stage.lng, stage.lat]}
              onSelected={() => handlePOIPress(stage)}
            >
              <View style={[styles.stageMarker, { backgroundColor: stage.color }]}>
                <Text style={styles.stageMarkerEmoji}>🎵</Text>
              </View>
              <Mapbox.Callout title={stage.name} />
            </Mapbox.PointAnnotation>
          ))}

          {/* POI markers */}
          {filteredPOIs.map(poi => (
            <Mapbox.PointAnnotation
              key={poi.id}
              id={`poi-${poi.id}`}
              coordinate={[poi.lng, poi.lat]}
              onSelected={() => handlePOIPress(poi)}
            >
              <View style={[styles.poiMarker, { backgroundColor: poi.color }]}>
                <Text style={styles.poiMarkerEmoji}>{poi.icon || '📍'}</Text>
              </View>
              <Mapbox.Callout title={poi.name} />
            </Mapbox.PointAnnotation>
          ))}
        </Mapbox.MapView>

        {/* Filter tabs overlaid at top */}
        <SafeAreaView style={styles.filterOverlay} pointerEvents="box-none">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORY_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={styles.filterEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>

        {/* Selected POI info card */}
        {selectedPOI && (
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setSelectedPOI(null)}
            activeOpacity={0.9}
          >
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoCardDot, { backgroundColor: selectedPOI.color }]} />
              <Text style={styles.infoCardTitle}>{selectedPOI.name}</Text>
            </View>
            {'description' in selectedPOI && selectedPOI.description ? (
              <Text style={styles.infoCardDesc}>{selectedPOI.description}</Text>
            ) : null}
            {'category' in selectedPOI && (
              <Text style={styles.infoCardCategory}>{selectedPOI.category.toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        )}
    </View>
  );
}

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
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6BBF59',
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterLabel: {
    color: 'rgba(245, 245, 220, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: '#1C2B20',
  },
  stageMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stageMarkerEmoji: {
    fontSize: 16,
  },
  poiMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  poiMarkerEmoji: {
    fontSize: 12,
  },
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoCardTitle: {
    color: '#F5F5DC',
    fontSize: 18,
    fontWeight: '700',
  },
  infoCardDesc: {
    color: 'rgba(245, 245, 220, 0.6)',
    fontSize: 14,
    marginTop: 6,
  },
  infoCardCategory: {
    color: '#6BBF59',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
});
