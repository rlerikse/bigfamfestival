// src/components/EventCard.tsx
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptimizedImage from './OptimizedImage';
import { ScheduleEvent } from '../types/event';

// Styles for the event cards (from MySchedule/Schedule screen)
const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 0, // ensure consistent vertical spacing so card height stays stable
    maxHeight: 100, // Match the image height for consistent card sizing
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10, // moved padding to the card container to stabilize height on press
    paddingHorizontal: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 13,
    marginBottom: 2,
  },
  eventGenres: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  eventDescription: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  heartButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 4,
  },
  favoriteText: {
    marginLeft: 0,
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
  },
});

export interface EventCardProps {
  item: ScheduleEvent;
  isInUserSchedule: boolean;
  onToggleSchedule: (event: ScheduleEvent) => void;
  onEventPress: (event: ScheduleEvent) => void;
  theme: {
    border: string;
    card: string;
    text: string;
    muted: string;
  };
  showStatusBadge?: boolean; // When true, shows LIVE/UPCOMING at top-right
  currentTime?: number; // Optional epoch ms used to recompute countdown/live
  /** Optional: duration (ms) for each half of the blink cycle; defaults to 700ms (slower blink). Full cycle = 2x */
  blinkDurationMs?: number;
  /** Optional: maximum border width during live strobe (px). Defaults to 3. */
  liveBorderMaxWidth?: number;
  /** Optional: maximum glow opacity for the soft glow effect. Defaults to 0.35. */
  liveGlowMaxOpacity?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const EventCard = React.memo<EventCardProps>(({ item, isInUserSchedule, theme, onToggleSchedule, onEventPress, showStatusBadge = false, currentTime, blinkDurationMs = 1200, liveBorderMaxWidth = 2, liveGlowMaxOpacity = 0.35 }) => {
  const formattedTime = useMemo(() => {
    if (!item.startTime) return '';
    const [hours, minutes] = item.startTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [item.startTime]);

  // Determine if event is LIVE or UPCOMING based on startTime only
  // Determine if event is LIVE or UPCOMING based on startTime only
  const isLive = useMemo(() => {
    if (!item.date || !item.startTime) return false;
    const startTs = new Date(`${item.date}T${item.startTime}`).getTime();
    let endTs: number;
    if (item.endTime && item.endTime.trim()) {
      endTs = new Date(`${item.date}T${item.endTime}`).getTime();
      // Handle events that cross midnight
      if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000;
    } else {
      // Fallback duration: 2 hours
      endTs = startTs + 2 * 60 * 60 * 1000;
    }
    const nowMs = typeof currentTime === 'number' ? currentTime : Date.now();
    return nowMs >= startTs && nowMs < endTs;
  }, [item.date, item.startTime, item.endTime, currentTime]);

  // Determine if event has ended
  const isPast = useMemo(() => {
    if (!item.date || !item.startTime) return false;
    const startTs = new Date(`${item.date}T${item.startTime}`).getTime();
    let endTs: number;
    if (item.endTime && item.endTime.trim()) {
      endTs = new Date(`${item.date}T${item.endTime}`).getTime();
      if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000; // cross-midnight handling
    } else {
      endTs = startTs + 2 * 60 * 60 * 1000; // fallback 2h duration
    }
    const nowMs = typeof currentTime === 'number' ? currentTime : Date.now();
    return nowMs >= endTs;
  }, [item.date, item.startTime, item.endTime, currentTime]);

  // Strobing border animation for LIVE events
  const borderAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (showStatusBadge && isLive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, { toValue: 1, duration: blinkDurationMs, useNativeDriver: false }),
          Animated.timing(borderAnim, { toValue: 0, duration: blinkDurationMs, useNativeDriver: false }),
        ])
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [borderAnim, showStatusBadge, isLive, blinkDurationMs]);

  const animatedBorderColor = useMemo(() => {
    return borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.border, '#FF3B30'],
    });
  }, [borderAnim, theme.border]);

  const animatedBorderWidth = useMemo(() => {
    return borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, liveBorderMaxWidth],
    });
  }, [borderAnim, liveBorderMaxWidth]);

  const glowOpacity = useMemo(() => {
    return borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, liveGlowMaxOpacity],
    });
  }, [borderAnim, liveGlowMaxOpacity]);

  const timeUntilStart = useMemo(() => {
    if (!item.date || !item.startTime) return '';
    const startTs = new Date(`${item.date}T${item.startTime}`).getTime();
    const nowMs = typeof currentTime === 'number' ? currentTime : Date.now();
    const diff = startTs - nowMs;
    if (diff <= 0) return '';
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < hour) {
      const mins = Math.ceil(diff / minute);
      return `${mins}m`;
    }
    if (diff < day) {
      const hrs = Math.floor(diff / hour);
      const mins = Math.ceil((diff % hour) / minute);
      return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    const days = Math.floor(diff / day);
    const hrs = Math.floor((diff % day) / hour);
    return `${days}d${hrs > 0 ? ` ${hrs}h` : ''}`;
  }, [item.date, item.startTime, currentTime]);

  const handleHeartPress = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onToggleSchedule(item);
  }, [item, onToggleSchedule]);

  const handleEventPress = useCallback(() => {
    onEventPress(item);
  }, [item, onEventPress]);

  // Note: Genres will be populated by genreService from artists' data

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.eventCard,
        {
          borderColor: isLive && showStatusBadge ? animatedBorderColor : theme.border,
          borderWidth: isLive && showStatusBadge ? (animatedBorderWidth as unknown as number) : 1,
          backgroundColor: theme.card,
          opacity: isPast ? 0.5 : 1,
        },
      ]}
      onPress={handleEventPress}
    >
      {/* Soft glow overlay for LIVE events */}
      {isLive && showStatusBadge && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            zIndex: 0,
            ...(Platform.OS === 'ios'
              ? {
                  shadowColor: '#FF3B30',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 12,
                  shadowOpacity: glowOpacity as unknown as number,
                }
              : {
                  borderWidth: 2,
                  borderColor: 'rgba(255,59,48,0.35)',
                  opacity: glowOpacity as unknown as number,
                }),
          }}
        />
      )}
      {isPast && (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 6,
            zIndex: 15,
          }}
          pointerEvents="none"
          accessibilityLabel="Event finished"
        >
          <Text
            style={{
              color: '#9E9E9E',
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 0.75,
            }}
            numberOfLines={1}
          >
            FINISHED
          </Text>
        </View>
      )}
      {showStatusBadge && !isLive && !isPast && !!timeUntilStart && (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: 'transparent',
            zIndex: 10,
          }}
          accessibilityLabel={`Starts in ${timeUntilStart}`}
        >
          <Text
            style={{
              color: theme.muted,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {timeUntilStart}
          </Text>
        </View>
      )}
      <OptimizedImage
        uri={item.imageUrl}
        style={styles.eventImage}
        containerStyle={styles.eventImage}
        contentFit="cover"
        showLoadingIndicator={false}
        fallbackImage={require('../assets/images/logo.png')}
      />
      <View style={styles.eventInfo}>
        <Text
          style={[styles.eventName, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        <Text
          style={[styles.eventDetails, { color: theme.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.stage} - {formattedTime}
        </Text>
        
        {/* Display genres if available */}
        {(item.genres && item.genres.length > 0) && (
          <Text 
            style={[styles.eventGenres, { color: '#B87333' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.genres.join(' • ')}
          </Text>
        )}
        
        {item.description && (
          <Text
            style={[styles.eventDescription, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.heartButton}
        onPress={handleHeartPress}
        accessibilityLabel={isInUserSchedule ? 'Remove from schedule' : 'Add to schedule'}
      >
        <Ionicons
          name={isInUserSchedule ? 'heart' : 'heart-outline'}
          size={24}
          color={isInUserSchedule ? '#B87333' : (theme.muted || '#666666')}
        />
        <Text style={[
          styles.favoriteText,
          { color: isInUserSchedule ? '#B87333' : (theme.muted || '#666666') }
        ]}>
          {isInUserSchedule ? 'Added' : 'Add'}
        </Text>
      </TouchableOpacity>
    </AnimatedTouchableOpacity>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
