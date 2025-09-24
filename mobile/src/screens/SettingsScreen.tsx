import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { useTheme } from '../contexts/ThemeContext';
import { useDebug } from '../contexts/DebugContext';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const { theme, isDark, isPerformanceMode, togglePerformanceMode } = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { setDebugMode } = useDebug();
  const { isGuestUser, deleteAccount } = useAuth();
  const { scheduleNotificationsEnabled, toggleScheduleNotifications } = useAppSettings();

  const handleDebugModeToggle = (value: boolean) => {
    setDebugMode(value);
    
    if (value) {
      // Navigate to debug screen when enabled
      navigation.navigate('Debug');
    }
  };

  const handleGoToProfile = () => {
    navigation.navigate('Profile');
  };

  const handleTestNotification = async () => {
    try {
      // Request permissions if not already granted
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "Please enable notifications in your device settings to receive event reminders."
        );
        return;
      }

      // Send an immediate notification
      await Notifications.presentNotificationAsync({
        title: "Test Notification",
        body: "This is a test notification from Big Fam Festival!",
        data: { test: 'test' },
      });
      
      Alert.alert("Test Notification Sent", "You should see a notification immediately.");
    } catch (error) {
      console.error('Failed to send notification:', error);
      Alert.alert("Error", "Failed to send notification. Check console for details.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Error',
                        'Failed to delete account. Please try again later.'
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // Build settings options dynamically based on user type
  const settingsOptions = [
    {
      title: 'General',
      items: [
        // Only show Profile option for non-guest users
        ...(!isGuestUser() ? [{
          icon: 'person-outline' as const,
          label: 'Profile',
          onPress: handleGoToProfile,
        }] : []),
        {
          icon: 'shield-outline',
          label: 'Privacy & Security',
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
        },
      ].filter(Boolean), // Remove any undefined items
    },
    {
      title: 'Notifications',
      items: [
        // Schedule notifications toggle (only for non-guest users)
        ...(!isGuestUser() ? [{
          icon: 'calendar-outline',
          label: 'Schedule Notifications',
          hasSwitch: true,
          switchValue: scheduleNotificationsEnabled,
          onSwitchToggle: toggleScheduleNotifications,
          description: 'Get notified 15 minutes before events in your schedule',
        }] : []),
        {
          icon: 'notifications-outline', 
          label: 'Test Notification',
          onPress: handleTestNotification,
          description: 'Send a test notification immediately',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: isDark ? 'moon-outline' : 'sunny-outline',
          label: 'Dark Mode',
          hasSwitch: false,
          hasToggle: true,
          description: 'Switch between light and dark themes',
        },
        {
          icon: 'speedometer-outline',
          label: 'Performance Mode',
          hasSwitch: true,
          switchValue: isPerformanceMode,
          onSwitchToggle: togglePerformanceMode,
          description: 'Enable performance optimizations',
        },
        {
          icon: 'language-outline',
          label: 'Language',
          onPress: () => Alert.alert('Coming Soon', 'Language settings coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Help & FAQ',
          onPress: () => Alert.alert('Coming Soon', 'Help section coming soon!'),
        },
        {
          icon: 'mail-outline',
          label: 'Contact Support',
          onPress: () => Alert.alert('Coming Soon', 'Contact support coming soon!'),
        },
        {
          icon: 'information-circle-outline',
          label: 'About',
          onPress: () => Alert.alert('Big Fam Festival', 'Version 1.0.0\n\nBuilt with ❤️ for the festival community'),
        },
      ],
    },
    // Only show Account section for non-guest users
    ...(!isGuestUser() ? [{
      title: 'Account',
      items: [
        {
          icon: 'trash-outline',
          label: 'Delete Account',
          onPress: handleDeleteAccount,
          danger: true,
        },
      ],
    }] : []),
  ];

  // TypeScript type annotations are causing conflicts with the dynamic nature of our items
  // Let's simplify and use type assertions where needed

  /**
   * Renders a settings item with proper layout and styling
   * @param {Object} item - The settings item configuration
   * @param {string} item.icon - Ionicons icon name
   * @param {string} item.label - Display label for the setting
   * @param {string} [item.description] - Optional description text
   * @param {Function} [item.onPress] - Handler for item press
   * @param {boolean} [item.hasSwitch] - Whether to show a toggle switch
   * @param {boolean} [item.hasToggle] - Whether to show dark mode toggle
   * @param {boolean} [item.switchValue] - Current value for the switch
   * @param {Function} [item.onSwitchToggle] - Handler for switch toggle
   * @param {boolean} [item.danger] - Whether to use danger styling
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderSettingsItem = (item: any) => {
    const isDanger = item.danger;
    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.settingsItem, { borderBottomColor: theme.border }]}
        onPress={item.onPress}
        disabled={item.hasSwitch || item.hasToggle}
      >
        <View style={styles.settingsItemLeft}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={isDanger ? '#FF3B30' : theme.primary} 
          />
          <View style={styles.settingsItemText}>
            <Text style={[
              styles.settingsItemLabel, 
              { color: isDanger ? '#FF3B30' : theme.text }
            ]}>
              {item.label}
            </Text>
            {item.description && typeof item.description === 'string' && (
              <Text style={[styles.settingsItemDescription, { color: theme.muted }]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        {item.hasToggle ? (
          <DarkModeToggle showLabel={false} size="small" />
        ) : item.hasSwitch ? (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchToggle}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={'#FFFFFF'}
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDanger ? '#FF3B30' : theme.muted} 
          />
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Renders a settings section with title and items
   * @param {Object} section - The section configuration
   * @param {string} section.title - Section title
   * @param {Array} section.items - Array of setting items
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderSettingsSection = (section: any) => {
    return (
      <View key={section.title} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {section.title}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {section.items.map(renderSettingsItem)}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {settingsOptions.map(renderSettingsSection)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default SettingsScreen;
