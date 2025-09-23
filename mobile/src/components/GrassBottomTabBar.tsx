import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import the hook
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext hook
import SafeText from './SafeText';

const { width } = Dimensions.get('window');

const NAVBAR_HEIGHT = 80; // Increased to accommodate text labels

// Proportions from grass-seamless.png (based on 1920x1080, relevant part 935px high)
// Grass height in image: ~495px
// Dirt height in image: ~440px
const IMG_TOTAL_RELEVANT_HEIGHT = 495 + 440;
const IMG_GRASS_PROPORTION = 495 / IMG_TOTAL_RELEVANT_HEIGHT; // ~0.529
const IMG_DIRT_PROPORTION = 440 / IMG_TOTAL_RELEVANT_HEIGHT;  // ~0.471

// Calculate scaled image dimensions to fit UI requirements
// We want the dirt part of the scaled image to perfectly fill NAVBAR_HEIGHT
const SCALED_TOTAL_IMAGE_HEIGHT = NAVBAR_HEIGHT / IMG_DIRT_PROPORTION; // Updated calculation
const SCALED_GRASS_HEIGHT = SCALED_TOTAL_IMAGE_HEIGHT * IMG_GRASS_PROPORTION; // Updated calculation

// The amount of grass visible will be the entire scaled grass height
const EFFECTIVE_GRASS_VISIBLE_HEIGHT = SCALED_GRASS_HEIGHT;

// Constants for positioning decorative elements (keep original values for consistency)
const ORIGINAL_NAVBAR_HEIGHT = 60;
const ORIGINAL_EFFECTIVE_GRASS_HEIGHT = 67.4;

const GrassBottomTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation
}) => {
  const insets = useSafeAreaInsets(); // Use the hook to get insets
  const bottomPadding = insets.bottom; // Get the bottom inset
  const { user, logout } = useAuth(); // Get user and logout function from auth context
  
  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* This View acts as a clipping mask for the Image */}
      <View style={[styles.imageContainer, { height: EFFECTIVE_GRASS_VISIBLE_HEIGHT + NAVBAR_HEIGHT + bottomPadding }]}>
        <Image
          source={require('../assets/images/grass-seamless.png')}
          style={[
            styles.actualImage,
            {
              height: SCALED_TOTAL_IMAGE_HEIGHT + bottomPadding,
              bottom: -bottomPadding, // Pull image down to fill safe area
            }
          ]}
          resizeMode="stretch" // Stretch to fit calculated dimensions precisely
          fadeDuration={0}
          loadingIndicatorSource={undefined}
        />
        
        {/* Tree image partially visible */}
        <Image
          source={require('../assets/images/tree-3.png')}
          style={styles.treeImage}
          resizeMode="contain"
          fadeDuration={0}
          loadingIndicatorSource={undefined}
        />

        {/* Tent image - Flipped, scaled, and positioned */}
        <Image
          source={require('../assets/images/tent.png')}
          style={styles.tentImage}
          resizeMode="contain"
          fadeDuration={0}
          loadingIndicatorSource={undefined}
        />
      </View>
      <View style={styles.navbar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            
            // Check if this is the Profile tab and user is a guest
            // Note: 'Profile' must match the exact route name in the tab navigator
            if (route.name === 'Profile' && user?.id === 'guest-user') {
              // Prevent default navigation
              event.preventDefault();
              
              // Show login prompt
              Alert.alert(
                'Login Required', 
                'You need to be logged in to view your profile.', 
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Login', 
                    onPress: async () => {
                      try {
                        // Need to logout first to remove guest user so Auth stack becomes available
                        await logout();
                        // Let the navigation system update to show Auth screen
                      } catch (error) {
                        console.error('Error during logout:', error);
                        Alert.alert('Error', 'Could not log out. Please try again.');
                      }
                    }
                  },
                ]
              );
              return;
            }
            
            // Handle case when user is already on Profile tab and taps it again
            if (isFocused && route.name === 'Profile' && user?.id === 'guest-user') {
              // Show login prompt even when focused
              Alert.alert(
                'Login Required', 
                'You need to be logged in to view your profile.', 
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Login', 
                    onPress: async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error('Error during logout:', error);
                        Alert.alert('Error', 'Could not log out. Please try again.');
                      }
                    }
                  },
                ]
              );
              return;
            }
            
            // For other tabs or logged in users, proceed normally
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
            ><View style={styles.tabContent}>
                {options.tabBarIcon && options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? '#D4946B' : '#F5F5DC',
                  size: 32,
                })}
                <SafeText 
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? '#D4946B' : '#F5F5DC' }
                  ]}
                >
                  {typeof options.tabBarLabel === 'function' 
                    ? options.tabBarLabel({
                        focused: isFocused,
                        color: isFocused ? '#D4946B' : '#F5F5DC',
                        position: 'below-icon',
                        children: options.title || route.name
                      })
                    : options.tabBarLabel || options.title || route.name
                  }
                </SafeText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({  container: {
    width: '100%',
    paddingTop: EFFECTIVE_GRASS_VISIBLE_HEIGHT - 20 , 
    // paddingBottom will be applied dynamically
    backgroundColor: 'transparent', // Default dirt color as fallback for any gaps
    position: 'absolute', // Ensure the grass overlays the content
    bottom: -50, // Move down by 50px to align properly with screen bottom
    zIndex: 10, // Ensure it appears above other elements
  },
  imageContainer: { 
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    // height will be applied dynamically
    overflow: 'visible', // Changed from 'hidden' to allow tree to extend outside
    zIndex: 0, 
  },  
  actualImage: { 
    position: 'absolute', 
    left: 0,            
    width: width, 
    // height and bottom will be applied dynamically
  },  treeImage: {
    position: 'absolute',
    left: -105, // Keep left aligned position (adjusted for smaller size)
    bottom: ORIGINAL_NAVBAR_HEIGHT + 60, // Moved up by 30px (was +30, now +60)
    width: 200, // Half of 400 - scaled down
    height: 150, // Half of 300 - scaled down
    opacity: 1, // Full opacity
    zIndex: 5, // Higher z-index to ensure visibility
  },  tentImage: {
    position: 'absolute',
    right: -45, // Moved 5px to the right (was -40)
    top: -ORIGINAL_EFFECTIVE_GRASS_HEIGHT + 40, // Back to original position
    width: 100, // Scaled width
    height: 80, // Scaled height
    transform: [{ scaleX: -1 }], // Flipped on X-axis
    zIndex: 6, // Ensure it's above the grass and tree
  },  navbar: {
    flexDirection: 'row',
    height: NAVBAR_HEIGHT,
    backgroundColor: 'transparent', // Crucial for the dirt part of image to show
    zIndex: 1, // Above backgroundImageStyle
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // For potential future absolute positioned elements within tabItem
  },  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: -80, // Moved icons up by 10px
  },tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default GrassBottomTabBar;
