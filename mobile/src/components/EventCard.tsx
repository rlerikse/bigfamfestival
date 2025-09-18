// src/components/EventCard.tsx
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
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
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
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
}

const EventCard = React.memo<EventCardProps>(({ item, isInUserSchedule, theme, onToggleSchedule, onEventPress }) => {
  const formattedTime = useMemo(() => {
    if (!item.startTime) return '';
    const [hours, minutes] = item.startTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [item.startTime]);

  const handleHeartPress = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onToggleSchedule(item);
  }, [item, onToggleSchedule]);

  const handleEventPress = useCallback(() => {
    onEventPress(item);
  }, [item, onEventPress]);

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { borderColor: theme.border, backgroundColor: theme.card }
      ]}
      onPress={handleEventPress}
    >
      {item.imageUrl && (
        <OptimizedImage
          uri={item.imageUrl}
          style={styles.eventImage}
          containerStyle={styles.eventImage}
          contentFit="cover"
          showLoadingIndicator={false}
          fallbackIcon="image-outline"
        />
      )}
      <View style={styles.eventInfo}>
        <Text style={[styles.eventName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.eventDetails, { color: theme.muted }]}>
          {item.stage} - {formattedTime}
        </Text>
        
        {item.description && (
          <Text
            style={[styles.eventDescription, { color: theme.text }]}
            numberOfLines={2}
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
    </TouchableOpacity>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
