// Commit: Example usage of DarkModeToggle in various components

/**
 * This file demonstrates how to use the DarkModeToggle component
 * in various parts of your app.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DarkModeToggle } from './DarkModeToggle';
import { useTheme } from '../contexts/ThemeContext';

// Example 1: In a header/navigation bar
export const AppHeader: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.card }]}>
      <View style={styles.headerLeft}>
        {/* Your app logo or title */}
      </View>
      
      <View style={styles.headerRight}>
        <DarkModeToggle showLabel={false} size="small" />
      </View>
    </View>
  );
};

// Example 2: In a floating action area
export const FloatingThemeToggle: React.FC = () => {
  return (
    <View style={styles.floatingContainer}>
      <DarkModeToggle showLabel={true} size="medium" />
    </View>
  );
};

// Example 3: Inline in any component
export const InlineToggleExample: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Your content */}
      
      {/* Quick theme toggle */}
      <View style={styles.inlineToggle}>
        <DarkModeToggle showLabel={true} size="large" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  inlineToggle: {
    alignItems: 'center',
    marginVertical: 16,
  },
});
