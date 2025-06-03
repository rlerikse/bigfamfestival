// Commit: Add placeholder Messages screen for bottom navigation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Placeholder Messages screen for future messaging functionality
 */
const MessagesScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Ionicons 
          name="chatbubbles-outline" 
          size={80} 
          color={theme.muted || '#666666'} 
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Messages
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Coming Soon!
        </Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          Connect with other festival-goers, share your experience, and stay updated with announcements.
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

export default MessagesScreen;
