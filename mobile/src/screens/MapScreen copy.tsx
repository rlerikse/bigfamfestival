import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from "@react-native-community/netinfo"; // Import NetInfo

// Import contexts and hooks
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Import services for API calls
import { markCampsite, removeCampsite } from '../services/userService';
import { getPOIs } from '../services/mapService';

// Types for POIs and location
interface POI {
  id: string;
  type: 'stage' | 'vendor' | 'facility' | 'campsite' | 'friend_campsite' | 'friend_location';
  name: string;
  location: {
    lat: number;
    long: number;
  };
  description?: string;
  userId?: string;
  profilePictureUrl?: string;
}

const MapScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  
  // State variables
  const [pois, setPois] = useState<POI[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(true);
  const [hasCampsite, setHasCampsite] = useState(false);
  const [campsiteLocation, setCampsiteLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [what3WordsAddress, setWhat3WordsAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(true); // Add state for online status
  
  // Get user location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setIsLoadingLocation(false);
          return;
        }
        
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(newLocation);
          // Save last known location for future use
        await AsyncStorage.setItem('last_known_location', JSON.stringify(newLocation));        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }} catch (err) {
        console.error('Error getting location:', err);
        
        // Try to recover with last known location
        try {
          const lastLocationStr = await AsyncStorage.getItem('last_known_location');
          if (lastLocationStr) {
            const lastLocation = JSON.parse(lastLocationStr);
            setUserLocation(lastLocation);
            setError(null); // Clear error since we have a fallback
          } else {
            setError('Could not get your location. Please check your settings.');
          }
        } catch (storageErr) {
          console.error('Error getting stored location:', storageErr);
          setError('Could not get your location. Please check your settings.');
        }
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    getUserLocation();
  }, []);
  
  // Get POIs from API
  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        setIsLoadingPOIs(true);
        // In a real app, this would fetch POIs from your backend API
        const response = await getPOIs();
        setPois(response);
        
        // Check if user has a campsite already
        const userCampsite = response.find(
          poi => poi.type === 'campsite' && poi.userId === user?.id
        );
        
        if (userCampsite) {
          setHasCampsite(true);
          setCampsiteLocation({
            latitude: userCampsite.location.lat,
            longitude: userCampsite.location.long,
          });
        }
      } catch (err) {
        console.error('Error fetching POIs:', err);
        setError('Could not load map points of interest.');
      } finally {
        setIsLoadingPOIs(false);
      }
    };
    
    if (user) {
      fetchPOIs();
    }
  }, [user]);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  // Mock What3Words API integration
  const mockGenerateWhat3Words = () => {
    // In a real implementation, this would call the What3Words API
    const words = [
      'table', 'chair', 'lamp', 'plant', 'book', 'pen', 'phone', 'laptop', 
      'window', 'door', 'room', 'wall', 'floor', 'ceiling', 'desk', 'shelf',
      'apple', 'banana', 'cherry', 'orange', 'grape', 'lemon', 'peach', 'plum'
    ];
    
    // Generate random 3-word address
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const w3 = words[Math.floor(Math.random() * words.length)];
    
    return `${w1}.${w2}.${w3}`;
  };
  // Render markers for react-native-maps
  const renderMarker = (poi: POI) => {
    // Choose color based on POI type
    let color: string;
    
    switch (poi.type) {
      case 'stage':
        color = theme.primary;
        break;
      case 'vendor':
        color = '#4BB543'; // Green
        break;
      case 'facility':
        color = '#FF0000'; // Red
        break;
      case 'campsite':
        color = poi.userId === user?.id ? theme.primary : '#FFD700'; // Gold
        break;
      case 'friend_campsite':
      case 'friend_location':
        color = '#8A2BE2'; // Purple
        break;
      default:
        color = theme.muted;
    }

    return (
      <Marker
        key={poi.id}
        coordinate={{
          latitude: poi.location.lat,
          longitude: poi.location.long,
        }}
        pinColor={color}
        title={poi.name}
        description={poi.description}
        onPress={() => handleMarkerPress(poi)}
      >
        <Callout onPress={() => handleNavigate(poi)}>
          <View style={styles.calloutContainer}>
            <Text style={[styles.calloutTitle, { color: 'black' }]}>{poi.name}</Text>
            {poi.description && (
              <Text style={[styles.calloutDescription, { color: 'black' }]}>
                {poi.description}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.navigateButton, { backgroundColor: theme.primary }]}
              onPress={() => handleNavigate(poi)}
            >
              <Text style={styles.navigateButtonText}>Take Me Here</Text>
            </TouchableOpacity>
          </View>
        </Callout>
      </Marker>
    );
  };
  // Handle marker press
  const handleMarkerPress = (poi: POI) => {
    Alert.alert(
      poi.name,
      poi.description || 'No description available',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Me Here', onPress: () => handleNavigate(poi) }
      ]
    );
  };
  // Handle navigation to POI
  const handleNavigate = (poi: POI) => {
    // In a real app, this would launch the embedded navigation
    Alert.alert(
      'Navigation',
      `Navigating to ${poi.name}`,
      // eslint-disable-next-line
      [{ text: 'OK', onPress: () => console.log('Navigate to', poi.name) }]
    );
  };
  
  // Handle marking the user's campsite
  const handleMarkCampsite = () => {
    if (!userLocation) {
      Alert.alert('Error', 'Cannot determine your location. Please try again.');
      return;
    }
    
    // Generate What3Words address
    const w3wAddress = mockGenerateWhat3Words();
    setWhat3WordsAddress(w3wAddress);
    
    // Show confirmation modal
    setShowConfirmModal(true);
  };
  
  // Confirm campsite marking
  const confirmMarkCampsite = async () => {
    if (!userLocation || !user) return;
    
    try {
      // Call API to mark campsite
      await markCampsite(user.id, userLocation.latitude, userLocation.longitude, true);
      
      // Update local state
      setHasCampsite(true);
      setCampsiteLocation(userLocation);
      
      // Add campsite to POIs
      const newCampsite: POI = {
        id: `campsite-${user.id}`,
        type: 'campsite',
        name: 'My Campsite',
        userId: user.id,
        location: {
          lat: userLocation.latitude,
          long: userLocation.longitude,
        },
        description: `What3Words: ${what3WordsAddress}`,
      };
      
      setPois([...pois, newCampsite]);
      
      // Close modal
      setShowConfirmModal(false);
      
      // Show success message
      Alert.alert('Success', 'Your campsite has been marked successfully!');
    } catch (err) {
      console.error('Error marking campsite:', err);
      Alert.alert('Error', 'Failed to mark your campsite. Please try again.');
    }
  };
  
  // Handle navigation to user's campsite
  const handleTakeMeHome = () => {
    if (!campsiteLocation) return;
    
    // In a real app, this would launch the embedded navigation
    Alert.alert(
      'Navigation',
      'Navigating to your campsite',
      // eslint-disable-next-line
      [{ text: 'OK', onPress: () => console.log('Navigate to campsite') }]
    );
  };
  
  // Handle removing the user's campsite
  const handleRemoveCampsite = async () => {
    if (!user) return;
    
    try {
      // Call API to remove campsite
      await removeCampsite(user.id);
      
      // Update local state
      setHasCampsite(false);
      setCampsiteLocation(null);
      
      // Remove campsite from POIs
      setPois(pois.filter(poi => !(poi.type === 'campsite' && poi.userId === user.id)));
      
      // Show success message
      Alert.alert('Success', 'Your campsite has been removed.');
    } catch (err) {
      console.error('Error removing campsite:', err);
      Alert.alert('Error', 'Failed to remove your campsite. Please try again.');
    }
  };
    // Only show loading screen if both location and POIs are still loading
  if (isLoadingLocation && isLoadingPOIs) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading map...</Text>
      </View>
    );
  }
    if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: 'transparent' }]}>
        <Ionicons name="alert-circle" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: 'transparent', flex: 1 }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={isDark ? [] : undefined} // Apply dark style if needed
      >
        {pois.map(poi => renderMarker(poi))}
      </MapView>
        {/* Custom Center on User Button */}
      {userLocation && (
        <TouchableOpacity
          style={[styles.centerUserButton, { top: 100, right: 20, backgroundColor: theme.card }]} // Adjusted top for vertical alignment with logo
          onPress={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000);
            }
          }}
        >
          <Ionicons name="locate-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      )}
      
      {/* Map Legend */}
      <View style={[styles.legendContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.legendTitle, { color: theme.text }]}>Legend</Text>
        <View style={styles.legendItem}>
          <Ionicons name="musical-notes" size={18} color={theme.primary} />
          <Text style={[styles.legendText, { color: theme.text }]}>Stage</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="restaurant" size={18} color="#4BB543" />
          <Text style={[styles.legendText, { color: theme.text }]}>Vendor</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="medkit" size={18} color="#FF0000" />
          <Text style={[styles.legendText, { color: theme.text }]}>Facility</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="home" size={18} color="#FFD700" />
          <Text style={[styles.legendText, { color: theme.text }]}>Campsite</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="person" size={18} color="#8A2BE2" />
          <Text style={[styles.legendText, { color: theme.text }]}>Friend</Text>
        </View>
      </View>
      
      {/* Offline Mode Indicator */}
      <View style={[styles.offlineContainer, { backgroundColor: theme.card }]}>
        <Ionicons 
          name={isOnline ? "cloud-done" : "cloud-offline"} 
          size={16} 
          color={isOnline ? '#4BB543' : theme.text} // Green when online, theme text when offline
          style={styles.offlineIcon} // Added style for margin
        />
        <Text style={[styles.offlineText, { color: theme.text }]}>
          {isOnline ? "Map is Online" : "Map is Offline - Cached Data"}
        </Text>
      </View>
      
      {/* Campsite Actions */}
      {hasCampsite ? (
        <>
          {/* Take Me Home Button */}
          <TouchableOpacity            style={[styles.floatingButton, { backgroundColor: isDark ? '#4BB543' : theme.secondary }]}
            onPress={handleTakeMeHome}
          >
            <Ionicons name="home" size={24} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>Take Me Home</Text>
          </TouchableOpacity>
          
          {/* Remove Campsite Button */}
          <TouchableOpacity
            style={[styles.removeCampsiteButton, { borderColor: theme.border }]}
            onPress={handleRemoveCampsite}
          >
            <Text style={[styles.removeCampsiteText, { color: theme.text }]}>
              Remove My Campsite
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Mark My Campsite Button */
        <TouchableOpacity          style={[styles.floatingButton, { backgroundColor: isDark ? '#4BB543' : theme.secondary }]}
          onPress={handleMarkCampsite}
        >
          <Ionicons name="flag" size={24} color="#FFFFFF" />
          <Text style={styles.floatingButtonText}>Mark My Campsite</Text>
        </TouchableOpacity>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>            <Text style={[styles.modalTitle, { color: theme.text }]}>Mark My Campsite</Text>
            <Text style={[styles.modalText, { color: theme.text }]}>
              Your current location:
            </Text>
            <Text style={[styles.w3wAddress, { color: theme.primary }]}>
              {what3WordsAddress}
            </Text>
            <Text style={[styles.modalText, { color: theme.text }]}>
              Would you like to mark this as your campsite?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.muted }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={confirmMarkCampsite}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDDDDD',
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  navigateButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  removeCampsiteButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
  },
  removeCampsiteText: {
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  centerUserButton: { 
    position: 'absolute',
    top: 100, // Vertically align with legend and offline indicator
    // bottom: 130, // Removed to use top alignment
    right: 20, 
    backgroundColor: 'rgba(255,255,255,0.8)', 
    padding: 10,
    borderRadius: 30, // Make it circular
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  legendContainer: {
    position: 'absolute',
    top: 100, 
    left: 10,
    padding: 10,
    borderRadius: 5,
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // transform: [{ scale: 0.8 }], // Removed scale
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  legendText: {
    marginLeft: 5,
  },
  offlineContainer: {
    position: 'absolute',
    top: 100, // Aligned with legendContainer top
    alignSelf: 'center', // Added to re-center horizontally
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    opacity: 0.9,
    // alignSelf: 'center', // Alternative for centering if parent doesn't have alignItems: 'center'
  },
  offlineIcon: {
    marginRight: 5, // Add space between icon and text
  },
  offlineText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  w3wAddress: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MapScreen;