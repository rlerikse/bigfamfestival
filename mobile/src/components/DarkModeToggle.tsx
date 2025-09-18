// Commit: Add dark mode toggle component with smooth animations

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface DarkModeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * DarkModeToggle - A component that allows users to toggle between light and dark themes
 * Features animated icon transitions and optional text label
 */
export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  showLabel = true,
  size = 'medium',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [animatedValue] = React.useState(new Animated.Value(isDark ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isDark, animatedValue]);

  const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;
  const fontSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;

  const handlePress = () => {
    toggleTheme();
  };

  const iconRotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const iconOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 1],
  });

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    iconContainer: {
      marginRight: showLabel ? 8 : 0,
    },
    label: {
      fontSize,
      fontWeight: '600',
      color: theme.text,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        accessibilityRole="switch"
        accessibilityState={{ checked: isDark }}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: iconRotation }],
              opacity: iconOpacity,
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={iconSize}
            color={theme.primary}
          />
        </Animated.View>
        {showLabel && (
          <Text style={styles.label}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
