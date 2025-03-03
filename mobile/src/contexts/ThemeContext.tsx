import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Colors based on festival branding
const lightTheme = {
  primary: '#FF3366', // Festival pink
  secondary: '#8A2BE2', // Festival purple
  background: '#FFFFFF',
  card: '#F9F9F9',
  text: '#333333',
  border: '#DDDDDD',
  notification: '#FF3366',
  success: '#4BB543',
  warning: '#FFD700',
  error: '#FF0000',
  muted: '#888888',
};

const darkTheme = {
  primary: '#FF3366', // Keep the festival pink for brand consistency
  secondary: '#8A2BE2', // Festival purple
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  border: '#444444',
  notification: '#FF3366',
  success: '#4BB543',
  warning: '#FFD700',
  error: '#FF0000',
  muted: '#BBBBBB',
};

export type Theme = typeof lightTheme;
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
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
  const [mode, setMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>(
    systemColorScheme === 'dark' ? darkTheme : lightTheme
  );

  // Initialize theme
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await SecureStore.getItemAsync('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadThemeMode();
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

  // Determine if the current theme is dark
  const isDark = 
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
