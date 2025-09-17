// Commit: Add OptimizedImage component for better scroll performance
// Author: GitHub Copilot, 2025-01-07

/**
 * OptimizedImage
 * A performance-optimized image component that handles loading states, errors,
 * and fallbacks gracefully to prevent scroll jank in lists.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Image, 
  View, 
  StyleSheet, 
  ImageStyle, 
  ViewStyle,
  ActivityIndicator,
  Text
} from 'react-native';
// @ts-expect-error - Temporary fix for Expo vector icons import
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface OptimizedImageProps {
  uri?: string | null;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  showLoadingIndicator?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  containerStyle,
  fallbackIcon = 'image-outline',
  showLoadingIndicator = true,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  onError,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convert Google Storage URLs to proper Firebase Storage URLs
  const optimizedUri = useMemo(() => {
    if (!uri) return null;
    
    if (uri.startsWith('gs://')) {
      const gsPath = uri.substring(5);
      const firstSlashIndex = gsPath.indexOf('/');
      if (firstSlashIndex > 0) {
        const bucket = gsPath.substring(0, firstSlashIndex);
        const objectPath = gsPath.substring(firstSlashIndex + 1);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
      }
    } else if (uri.startsWith('http')) {
      return uri;
    } else if (uri.trim()) {
      return `https://big-fam-app.S3.us-east-2.amazonaws.com/${uri}`;
    }
    return null;
  }, [uri]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Combined container style
  const combinedContainerStyle = useMemo(() => [
    styles.container,
    containerStyle,
    { backgroundColor: theme.border }
  ], [containerStyle, theme.border]);

  // If no URI, show fallback immediately
  if (!optimizedUri) {
    return (
      <View style={combinedContainerStyle}>
        <Ionicons 
          name={fallbackIcon} 
          size={24} 
          color={theme.muted || '#666666'} 
        />
      </View>
    );
  }

  return (
    <View style={combinedContainerStyle}>
      {/* Main image */}
      <Image
        source={{ uri: optimizedUri }}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // Performance optimizations
        fadeDuration={150} // Reduced fade duration for smoother transitions
        loadingIndicatorSource={undefined} // Disable default loading indicator
        progressiveRenderingEnabled={true}
      />

      {/* Loading state */}
      {isLoading && showLoadingIndicator && !hasError && (
        <View style={styles.overlay}>
          {placeholder || (
            <ActivityIndicator 
              size="small" 
              color={theme.primary} 
            />
          )}
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={styles.overlay}>
          <Ionicons 
            name="image-outline" 
            size={24} 
            color={theme.muted || '#666666'} 
          />
          <Text style={[styles.errorText, { color: theme.muted }]}>
            Image unavailable
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default OptimizedImage;