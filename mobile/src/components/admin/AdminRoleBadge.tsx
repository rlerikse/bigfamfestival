import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminRoleBadgeProps {
  role: string;
  small?: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:     { bg: '#ef4444', text: '#fff' },
  staff:     { bg: '#f97316', text: '#fff' },
  artist:    { bg: '#a855f7', text: '#fff' },
  director:  { bg: '#ec4899', text: '#fff' },
  vendor:    { bg: '#14b8a6', text: '#fff' },
  volunteer: { bg: '#3b82f6', text: '#fff' },
  attendee:  { bg: '#6b7280', text: '#fff' },
};

export const AdminRoleBadge: React.FC<AdminRoleBadgeProps> = ({ role, small }) => {
  const colors = ROLE_COLORS[role] ?? { bg: '#6b7280', text: '#fff' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: colors.text }, small && styles.smallText]}>
        {role.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 9,
  },
});
