import React, { useState } from 'react';
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TopNavBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSearchBar?: boolean;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = (props) => {
  const { 
    onSearch, 
    placeholder = 'Search events, artists...', 
    onNotificationsPress, 
    onSettingsPress 
  } = props;
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchContainerWidth, setSearchContainerWidth] = useState(0);
  const searchAnimatedWidth = React.useRef(new Animated.Value(0)).current;

  function handleSearchChange(text: string): void {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  }

  function expandSearch(): void {
    setIsSearchExpanded(true);
    Animated.timing(searchAnimatedWidth, {
      toValue: searchContainerWidth - 50, // Leave room for settings icon
      duration: 300,
      useNativeDriver: false
    }).start();
  }

  function collapseSearch(): void {
    Animated.timing(searchAnimatedWidth, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start(function() {
      setIsSearchExpanded(false);
      if (searchQuery) {
        setSearchQuery('');
        if (onSearch) {
          onSearch('');
        }
      }
    });
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
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/bf-logo-trans.png')}
            style={styles.logo}
            resizeMode="contain"
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
                color={isDark ? '#F5F5DC' : '#000'}
              />
            </TouchableOpacity>
          )}

          <View style={styles.searchArea}>
            {isSearchExpanded ? (
              <Animated.View style={[styles.expandedSearch, { width: searchAnimatedWidth }]}
              >
                <Ionicons
                  name="search"
                  size={24}
                  color={isDark ? '#F5F5DC' : '#000'}
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
                    color={isDark ? '#F5F5DC' : '#000'}
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity onPress={expandSearch} style={styles.iconButton}>
                <Ionicons
                  name="search"
                  size={24}
                  color={isDark ? '#F5F5DC' : '#000'}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={handleSettingsPress} 
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDark ? '#F5F5DC' : '#000'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: '100%',
    marginBottom: 0,
    paddingBottom: 0 // Ensure no bottom padding
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    width: '100%',
    paddingHorizontal: 16,
    height: 55 // Reduced height to make filters flush with navbar
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
    top: -58,
    height: 175
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
    marginLeft: 8
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
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 8,
    height: 40,
    textAlignVertical: 'center',
    color: '#F5F5DC'
  },
  clearButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default TopNavBar;
