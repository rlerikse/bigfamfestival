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

import { useTheme } from '../contexts/ThemeContext';
import { useDebug } from '../contexts/DebugContext';
import { RootStackParamList } from '../navigation';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const { theme, isDark, setMode, isPerformanceMode, togglePerformanceMode } = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { debugMode, setDebugMode } = useDebug();

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

  const handleThemeToggle = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const settingsOptions = [
    {
      title: 'General',
      items: [
        {
          icon: 'person-outline',
          label: 'Profile',
          onPress: handleGoToProfile,
        },
        {
          icon: 'notifications-outline', 
          label: 'Notifications',
          onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon!'),
        },
        {
          icon: 'shield-outline',
          label: 'Privacy & Security',
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: isDark ? 'moon-outline' : 'sunny-outline',
          label: 'Dark Mode',
          hasSwitch: true,
          switchValue: isDark,
          onSwitchChange: handleThemeToggle,
          description: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        },
        {
          icon: 'speedometer-outline',
          label: 'Performance Mode',
          hasSwitch: true,
          switchValue: isPerformanceMode,
          onSwitchChange: togglePerformanceMode,
          description: 'Optimize for performance over visual effects',
        },
        {
          icon: 'language-outline',
          label: 'Language',
          onPress: () => Alert.alert('Coming Soon', 'Language settings coming soon!'),
        },
      ],
    },
    {
      title: 'Developer',
      items: [
        {
          icon: 'bug-outline',
          label: 'Debug Mode',
          hasSwitch: true,
          switchValue: debugMode,
          onSwitchChange: handleDebugModeToggle,
          description: 'Enable debug mode for Day/Night cycle controls',
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
  ];

  const renderSettingsItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.settingsItem, { borderBottomColor: theme.border }]}
        onPress={item.onPress}
        disabled={item.hasSwitch}
      >
        <View style={styles.settingsItemLeft}>
          <Ionicons name={item.icon} size={24} color={theme.primary} />
          <View style={styles.settingsItemText}>
            <Text style={[styles.settingsItemLabel, { color: theme.text }]}>
              {item.label}
            </Text>
            {item.description && (
              <Text style={[styles.settingsItemDescription, { color: theme.muted }]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        {item.hasSwitch ? (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={'#FFFFFF'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        )}
      </TouchableOpacity>
    );
  };

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

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
