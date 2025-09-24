// src/contexts/AppSettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { scheduleAllUserEventsNotifications, cancelAllUserEventsNotifications } from '../services/notificationService';

interface AppSettingsContextProps {
  scheduleNotificationsEnabled: boolean;
  toggleScheduleNotifications: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextProps | undefined>(undefined);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduleNotificationsEnabled, setScheduleNotificationsEnabled] = useState<boolean>(true);
  const { user, isGuestUser } = useAuth();

  // Load saved settings when the user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (user && !isGuestUser()) {
        try {
          const savedNotificationSetting = await AsyncStorage.getItem(`schedule_notifications_enabled_${user.id}`);
          // Default to true if no setting is saved
          setScheduleNotificationsEnabled(savedNotificationSetting !== 'false');
        } catch (error) {
          console.error('Error loading notification settings:', error);
          // Default to true on error
          setScheduleNotificationsEnabled(true);
        }
      } else {
        // Guest users don't have notification settings
        setScheduleNotificationsEnabled(false);
      }
    };

    loadSettings();
  }, [user, isGuestUser]);

  // Toggle schedule notifications
  const toggleScheduleNotifications = async () => {
    if (user && !isGuestUser()) {
      try {
        const newValue = !scheduleNotificationsEnabled;
        setScheduleNotificationsEnabled(newValue);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(`schedule_notifications_enabled_${user.id}`, newValue ? 'true' : 'false');
        
        // Update scheduled notifications
        if (newValue) {
          await scheduleAllUserEventsNotifications(user.id);
        } else {
          await cancelAllUserEventsNotifications();
        }
      } catch (error) {
        console.error('Error toggling schedule notifications:', error);
      }
    }
  };

  return (
    <AppSettingsContext.Provider
      value={{
        scheduleNotificationsEnabled,
        toggleScheduleNotifications
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};