import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Colors based on festival branding (bf.jpg)
const lightTheme = {
  primary: '#2E4031',    // Dark Green (from trees/logo background)
  secondary: '#6BBF59',  // Bright Green (accent from logo/grass)
  background: '#F5F5DC',  // Cream/Off-White (for background)
  card: '#FFFFFF',        // White for cards to stand out on cream
  text: '#4A3B31',        // Dark Brown (for text)
  border: '#D2B48C',      // Light Brown/Tan (for borders)
  notification: '#6BBF59',// Bright Green for notifications
  success: '#6BBF59',    // Bright Green for success
  warning: '#FFA500',     // Orange for warning (standard)
  error: '#D22B2B',       // Dark Red for error (standard)
  muted: '#8A7967',       // Muted Brown/Gray
};

const darkTheme = {
  primary: '#6BBF59',    // Bright Green (as primary on dark background)
  secondary: '#2E4031',  // Dark Green (as secondary)
  background: '#1C2B20',  // Very Dark Green/Brown (for background)
  card: '#2E4031',        // Dark Green (for cards)
  text: '#F5F5DC',        // Cream/Off-White (for text)
  border: '#4A3B31',      // Dark Brown (for borders)
  notification: '#6BBF59',// Bright Green for notifications
  success: '#6BBF59',    // Bright Green for success
  warning: '#FFA500',     // Orange for warning (standard)
  error: '#FF6B6B',       // Lighter Red for error on dark background
  muted: '#A89C8C',       // Muted Cream/Gray
};

export type Theme = typeof lightTheme;
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isPerformanceMode: boolean; // Added
  togglePerformanceMode: () => void; // Added
  toggleTheme: () => void; // Added dark mode toggle
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<Theme>(lightTheme);
  const [isPerformanceMode, setIsPerformanceMode] = useState(false); // Added performance mode state

  // Initialize theme and performance mode
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await SecureStore.getItemAsync('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        } else {
          // Default to light mode if no saved preference
          setMode('light');
        }
        const savedPerformanceMode = await SecureStore.getItemAsync('performanceMode');
        if (savedPerformanceMode) {
          setIsPerformanceMode(savedPerformanceMode === 'true');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to light mode on error
        setMode('light');
      }
    };

    loadSettings();
  }, []);

  // Update theme when mode changes
  useEffect(() => {
    const applyTheme = async () => {
      let selectedTheme: Theme;
      
      if (mode === 'system') {
        selectedTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
      } else {
        selectedTheme = mode === 'dark' ? darkTheme : lightTheme;
      }
      
      setTheme(selectedTheme);
      
      // Save mode preference
      try {
        await SecureStore.setItemAsync('themeMode', mode);
      } catch (error) {
        console.error('Error saving theme mode:', error);
      }
    };

    applyTheme();
  }, [mode, systemColorScheme]);

  // Toggle performance mode and save preference
  const togglePerformanceMode = async () => {
    const newPerformanceMode = !isPerformanceMode;
    setIsPerformanceMode(newPerformanceMode);
    try {
      await SecureStore.setItemAsync('performanceMode', newPerformanceMode.toString());
    } catch (error) {
      console.error('Error saving performance mode:', error);
    }
  };

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  // Determine if the current theme is dark
  const isDark = 
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark, isPerformanceMode, togglePerformanceMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
