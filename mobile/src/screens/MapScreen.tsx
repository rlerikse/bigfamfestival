import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TopNavBar from '../components/TopNavBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import * as Location from 'expo-location';

const FESTIVAL_CENTER: [number, number] = [-84.2575, 42.0577];
const DEFAULT_ZOOM = 16;

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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [zones, setZones] = useState<MapZone[]>([]);
  const [pois, setPois] = useState<MapPOI[]>([]);
  const [stages, setStages] = useState<StageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<(MapPOI | StageLocation) | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      const zonesSnap = await getDoc(doc(firestore, 'config', 'mapZones'));
      if (zonesSnap.exists()) {
        const data = zonesSnap.data();
        if (data.geojson) {
          const parsed = JSON.parse(data.geojson);
          setZones(parsed.features || []);
        }
      }

      const poisSnap = await getDocs(collection(firestore, 'mapPOIs'));
      const poiList: MapPOI[] = poisSnap.docs.map(d => ({ id: d.id, ...d.data() } as MapPOI));
      setPois(poiList);

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

  const zoneGeoJSON = {
    type: 'FeatureCollection' as const,
    features: zones.filter(z => z.geometry.type === 'Polygon'),
  };

  const handlePOIPress = useCallback((poi: MapPOI | StageLocation) => {
    setSelectedPOI(prev => prev === poi ? null : poi);
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(currentZoom + 1, 20);
    setCurrentZoom(newZoom);
    cameraRef.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
    });
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(currentZoom - 1, 10);
    setCurrentZoom(newZoom);
    cameraRef.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
    });
  }, [currentZoom]);

  const handleCenterOnUser = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fall back to festival center if permission denied
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
      // Fall back to festival center
      cameraRef.current?.setCamera({
        centerCoordinate: FESTIVAL_CENTER,
        zoomLevel: DEFAULT_ZOOM,
        animationDuration: 500,
      });
    }
  }, [currentZoom]);

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
        compassEnabled={true}
        logoEnabled={true}
        attributionEnabled={true}
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
        {stages.map(stage => (
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
        {pois.map(poi => (
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

      {/* Top NavBar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <TopNavBar showSearchBar={false} whiteIcons />
      </View>

      {/* Map Controls — right side */}
      <View style={[styles.mapControls, { top: insets.top + 60 }]}>
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
