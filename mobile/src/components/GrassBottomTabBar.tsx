import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import the hook

const { width } = Dimensions.get('window');

const NAVBAR_HEIGHT = 60;

// Proportions from grass-seamless.png (based on 1920x1080, relevant part 935px high)
// Grass height in image: ~495px
// Dirt height in image: ~440px
const IMG_TOTAL_RELEVANT_HEIGHT = 495 + 440;
const IMG_GRASS_PROPORTION = 495 / IMG_TOTAL_RELEVANT_HEIGHT; // ~0.529
const IMG_DIRT_PROPORTION = 440 / IMG_TOTAL_RELEVANT_HEIGHT;  // ~0.471

// Calculate scaled image dimensions to fit UI requirements
// We want the dirt part of the scaled image to perfectly fill NAVBAR_HEIGHT
const SCALED_TOTAL_IMAGE_HEIGHT = NAVBAR_HEIGHT / IMG_DIRT_PROPORTION; // ~127.4px
const SCALED_GRASS_HEIGHT = SCALED_TOTAL_IMAGE_HEIGHT * IMG_GRASS_PROPORTION; // ~67.4px

// The amount of grass visible will be the entire scaled grass height
const EFFECTIVE_GRASS_VISIBLE_HEIGHT = SCALED_GRASS_HEIGHT;

const GrassBottomTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation
  // safeAreaInsets removed from here
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets(); // Use the hook to get insets
  const bottomPadding = insets.bottom; // Get the bottom inset
  
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

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key} // Use route.key for a more stable key
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              {options.tabBarIcon && options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? theme.primary : theme.muted,
                size: 32, // Increased icon size
              })}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: EFFECTIVE_GRASS_VISIBLE_HEIGHT , 
    // paddingBottom will be applied dynamically
    backgroundColor: 'transparent', // Default dirt color as fallback for any gaps
    position: 'absolute', // Ensure the grass overlays the content
    bottom: 0, // Stick to the bottom of the screen
    zIndex: 10, // Ensure it appears above other elements
  },
  imageContainer: { 
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    // height will be applied dynamically
    overflow: 'hidden', 
    zIndex: 0, 
  },
  actualImage: { 
    position: 'absolute', 
    left: 0,            
    width: width, 
    // height and bottom will be applied dynamically
  },
  navbar: {
    flexDirection: 'row',
    height: NAVBAR_HEIGHT /2 ,
    backgroundColor: 'transparent', // Crucial for the dirt part of image to show
    zIndex: 1, // Above backgroundImageStyle
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // For potential future absolute positioned elements within tabItem
  },
});

export default GrassBottomTabBar;
