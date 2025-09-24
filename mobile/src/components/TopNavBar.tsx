import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TopNavBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSearchBar?: boolean;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
  whiteIcons?: boolean;
}

const TopNavBar: React.FC<TopNavBarProps> = (props) => {
  const { 
    onSearch, 
    placeholder = 'Search artist, vendor...', 
    onNotificationsPress, 
    onSettingsPress,
    whiteIcons = false
  } = props;
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchContainerWidth, setSearchContainerWidth] = useState(0);
  const searchAnimatedWidth = React.useRef(new Animated.Value(0)).current;

  // Determine icon color based on whiteIcons prop or theme
  const getIconColor = () => {
    return whiteIcons ? '#FFFFFF' : (isDark ? '#F5F5DC' : '#000');
  };

  function handleSearchChange(text: string): void {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  }

  function expandSearch(): void {
    setIsSearchExpanded(true);
    Animated.timing(searchAnimatedWidth, {
      toValue: searchContainerWidth + 20, // Expand to full width of actionsContainer + 20px
      duration: 300,
      useNativeDriver: false
    }).start();
  }

  function collapseSearch(): void {
    // Instantly hide the expanded search and show the original search icon
    setIsSearchExpanded(false);
    // Reset the animated width to 0, so the next expansion animates correctly
    searchAnimatedWidth.setValue(0);

    if (searchQuery) {
      setSearchQuery('');
      if (onSearch) {
        onSearch('');
      }
    }
  }

  function getSearchContainerWidth(event: LayoutChangeEvent): void {
    setSearchContainerWidth(event.nativeEvent.layout.width);
  }

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    }
  };  return (
    <View style={[styles.container, { paddingTop: insets.top }]} pointerEvents="box-none">
      <View style={styles.content}>
        <View style={styles.logoContainer} pointerEvents='none'>
          <ExpoImage
            source={require('../assets/images/bf-logo-trans.png')}
            style={styles.logo}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            accessibilityLabel="Big Fam Festival Logo"
          />
        </View>
        
        <View 
          style={styles.actionsContainer}
          onLayout={getSearchContainerWidth}
        >
          {!isSearchExpanded && (
            <TouchableOpacity 
              onPress={handleNotificationsPress} 
              style={styles.iconButton}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={getIconColor()}
              />
            </TouchableOpacity>
          )}

          <View style={[
            styles.searchArea,
            isSearchExpanded && styles.searchAreaExpanded
          ]}>
            {isSearchExpanded ? (
              <Animated.View style={[styles.expandedSearch, { width: searchAnimatedWidth }]}
              >
                <Ionicons
                  name="search"
                  size={24}
                  color={getIconColor()}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#F5F5DC' : '#000' }]}
                  placeholder={placeholder}
                  placeholderTextColor={isDark ? 'rgba(245,245,220,0.7)' : 'rgba(0,0,0,0.7)'}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  returnKeyType="search"
                  autoFocus={true}
                />
                <TouchableOpacity onPress={collapseSearch} style={styles.clearButton}>
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={getIconColor()}
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity onPress={expandSearch} style={styles.iconButton}>
                <Ionicons
                  name="search"
                  size={24}
                  color={getIconColor()}
                />
              </TouchableOpacity>
            )}
          </View>
          
          {!isSearchExpanded && (
            <TouchableOpacity 
              onPress={handleSettingsPress} 
              style={[styles.iconButton, { marginLeft: 8 }]}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={getIconColor()}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({  container: {
    backgroundColor: 'transparent',
    width: '100%',
    marginBottom: 0,
    paddingBottom: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    width: '100%',
    paddingHorizontal: 16,
    height: 55,
  },
  logoContainer: {
    width: 160,
    height: 60,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -20,
    zIndex: 1
  },
  logo: {
    width: 160,
    position: 'absolute',
    top: -33,
    height: 125
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginLeft: 8 // This margin is for when it's between notification and settings icons
  },
  searchAreaExpanded: {
    flex: 1, // Take up all available space in actionsContainer
    marginLeft: 0, // No margin when expanded
  },
  iconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20
  },
  expandedSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 40,
    position: 'absolute',
    right: 0,
    zIndex: 10
  },
  searchIcon: {
    marginRight: 8
  },  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 8,
    height: 40,
    color: '#F5F5DC'
  },  clearButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TopNavBar;
