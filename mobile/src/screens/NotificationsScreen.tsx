// Commit: Replace Messages screen with Notifications placeholder screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import TopNavBar from '../components/TopNavBar';

/**
 * Placeholder Notifications screen for future notifications functionality
 */
const NotificationsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopNavBar whiteIcons={isDark} />
      <View style={styles.content}>
        <Ionicons 
          name="notifications-outline" 
          size={80} 
          color={theme.muted || '#666666'} 
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Notifications
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          No new notifications
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          Stay updated with festival announcements, artist updates, and important information.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;
