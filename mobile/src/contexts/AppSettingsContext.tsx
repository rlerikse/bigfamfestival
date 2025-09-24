// src/contexts/AppSettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { scheduleAllUserEventsNotifications, cancelAllUserEventsNotifications } from '../services/notificationService';

export type SupportedLanguage = 'en' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

interface AppSettingsContextProps {
  scheduleNotificationsEnabled: boolean;
  toggleScheduleNotifications: () => Promise<void>;
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  getSupportedLanguages: () => LanguageOption[];
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
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const { user, isGuestUser } = useAuth();

  // Load saved settings when the user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (user && !isGuestUser()) {
        try {
          const savedNotificationSetting = await AsyncStorage.getItem(`schedule_notifications_enabled_${user.id}`);
          const savedLanguageSetting = await AsyncStorage.getItem(`app_language_${user.id}`);
          // Default to true if no setting is saved
          setScheduleNotificationsEnabled(savedNotificationSetting !== 'false');
          // Set current language or default to English
          setCurrentLanguage((savedLanguageSetting as SupportedLanguage) || 'en');
        } catch (error) {
          console.error('Error loading settings:', error);
          // Default to true on error
          setScheduleNotificationsEnabled(true);
          setCurrentLanguage('en');
        }
      } else {
        // Guest users don't have notification settings
        setScheduleNotificationsEnabled(false);
        // Load global language setting for guests
        try {
          const savedLanguage = await AsyncStorage.getItem('global_language');
          if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
            setCurrentLanguage(savedLanguage as SupportedLanguage);
          }
        } catch (error) {
          console.error('Error loading guest language setting:', error);
          setCurrentLanguage('en');
        }
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

  // Change app language
  const changeLanguage = async (language: SupportedLanguage) => {
    try {
      setCurrentLanguage(language);
      
      if (user && !isGuestUser()) {
        // Save to user-specific storage
        await AsyncStorage.setItem(`app_language_${user.id}`, language);
      } else {
        // Save to global storage for guests
        await AsyncStorage.setItem('global_language', language);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Get supported languages
  const getSupportedLanguages = () => {
    return SUPPORTED_LANGUAGES;
  };

  return (
    <AppSettingsContext.Provider
      value={{
        scheduleNotificationsEnabled,
        toggleScheduleNotifications,
        currentLanguage,
        changeLanguage,
        getSupportedLanguages
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};