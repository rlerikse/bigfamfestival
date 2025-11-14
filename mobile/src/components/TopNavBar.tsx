import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface TopNavBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSearchBar?: boolean;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
  whiteIcons?: boolean;
  unreadCount?: number; // optional external control for unread badge
}

const TopNavBar: React.FC<TopNavBarProps> = (props) => {
  const { 
    onSearch, 
    placeholder = 'Search artist, vendor...', 
    onNotificationsPress, 
    onSettingsPress,
    whiteIcons = false,
    unreadCount,
  } = props;
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchContainerWidth, setSearchContainerWidth] = useState(0);
  const searchAnimatedWidth = React.useRef(new Animated.Value(0)).current;
  const [hasUnread, setHasUnread] = useState(false);

  const refreshUnread = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('visible_notifications_count');
      const count = raw ? parseInt(raw, 10) : 0;
      setHasUnread(Number.isFinite(count) && count > 0);
    } catch {
      setHasUnread(false);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Refresh when the hosting screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshUnread();
      return undefined;
    }, [refreshUnread])
  );

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
    } else {
      // Navigate to Notifications screen
      navigation.navigate('Notifications' as never);
    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      // Navigate to Settings screen
      navigation.navigate('Settings' as never);
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
              <View>
                <Ionicons
                  name={route?.name === 'Notifications' ? 'notifications' : 'notifications-outline'}
                  size={24}
                  color={getIconColor()}
                />
                {(typeof unreadCount === 'number' ? unreadCount > 0 : hasUnread) ? (
                  <View style={styles.redDot} accessibilityLabel="Unread notifications" />
                ) : null}
              </View>
            </TouchableOpacity>
          )}

          {/* Search functionality - hidden until fully implemented
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
          */}
          
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
    zIndex: 2000,
    elevation: 12,
    overflow: 'visible'
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
    top: -20,
    height: 110,
    overflow: 'visible'
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
  redDot: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -2 : 0,
    right: Platform.OS === 'ios' ? -2 : 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
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
