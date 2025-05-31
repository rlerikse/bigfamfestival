import React, { useState } from 'react';
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'; // Removed Dimensions and Platform
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TopNavBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSearchBar?: boolean;
}

const TopNavBar: React.FC<TopNavBarProps> = ({
  onSearch,
  placeholder = 'Search events, artists...',
  showSearchBar = true,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onSearch?.(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top, backgroundColor: 'transparent' } // Transparent background
    ]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/bf-logo-trans.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        {/* Search Bar */}
        {showSearchBar && (
          <View style={[
            styles.searchContainer,
            { backgroundColor: 'transparent', marginTop: 10 } // Transparent, moved down
          ]}>
            <Ionicons
              name="search"
              size={24} // larger icon
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
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={isDark ? '#F5F5DC' : '#000'}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.rightSpacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    minHeight: 200, // increased height for logo and search
  },  logoContainer: {
    width: 180, 
    alignItems: 'center',
    justifyContent: 'center', // Center logo vertically
  },
  logo: {
    width: 180, 
    height: 180, // enlarged logo
    marginTop: -20, // Move logo up
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, borderRadius: 25,
    height: 160, // match logo height minus padding
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1, fontSize: 18,
  },
  clearButton: {
    padding: 4, marginLeft: 8,
  },
  rightSpacer: {
    width: 180, // match logoContainer
  },
});

export default TopNavBar;
