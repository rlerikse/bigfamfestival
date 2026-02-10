import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { festivalConfig } from '../config/festival.config';

// Colors loaded from festival configuration
const lightTheme = festivalConfig.theme.light;
const darkTheme = festivalConfig.theme.dark;

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
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        } else {
          // Default to light mode if no saved preference
          setMode('light');
        }
        const savedPerformanceMode = await AsyncStorage.getItem('performanceMode');
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
        await AsyncStorage.setItem('themeMode', mode);
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
      await AsyncStorage.setItem('performanceMode', newPerformanceMode.toString());
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
