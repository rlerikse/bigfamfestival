// src/components/NotificationHistoryItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationHistoryItemProps {
  title: string;
  body: string;
  sentAt: string;
  category?: string;
  priority?: 'normal' | 'high';
  onDismiss?: () => void;
  isDark?: boolean;
}

/**
 * Component to display a single notification history item
 * Used in the admin notification history view
 */
const NotificationHistoryItem: React.FC<NotificationHistoryItemProps> = ({
  title,
  body,
  sentAt,
  category = 'announcement',
  priority = 'normal',
  onDismiss,
  isDark,
}) => {
  const { theme } = useTheme();

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get icon based on notification category
  const getCategoryIcon = () => {
    const c = String(category || '').toLowerCase();
    switch (c) {
      case 'emergency':
        return 'warning';
      case 'my_schedule':
        return 'heart-outline';
      case 'schedule_change':
        return 'calendar-outline';
      case 'promotion':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const isEmergency = String(category || '').toLowerCase() === 'emergency';
  const isMySchedule = String(category || '').toLowerCase() === 'my_schedule';
  const accentColor = isEmergency
    ? (theme?.error || '#D22B2B')
    : isMySchedule
    ? '#B87333' // copper
    : priority === 'high'
    ? '#FF3B30'
    : '#3498db';

  return (
    <View
      style={[
        styles.container,
        {
          borderLeftColor: accentColor,
          borderLeftWidth: 4,
          borderColor: isEmergency ? accentColor : 'transparent',
          borderWidth: isEmergency ? 1 : 0,
          backgroundColor: theme?.card || (isDark ? '#222' : '#fff'),
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getCategoryIcon()} size={24} color={accentColor} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme?.text || (isDark ? '#fff' : '#222') }]} numberOfLines={1}>
            {title}
          </Text>
          {priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>High</Text>
            </View>
          )}
          {onDismiss ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              onPress={onDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-outline" size={22} color={theme?.muted || '#999'} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={[styles.body, { color: theme?.text || (isDark ? '#fff' : '#222') }]} numberOfLines={2}>
          {body}
        </Text>
        <Text style={[styles.timestamp, { color: theme?.muted || (isDark ? '#bbb' : '#888') }]}>{formatDate(sentAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  dismissButton: {
    marginLeft: 8,
    paddingLeft: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
});

export default NotificationHistoryItem;