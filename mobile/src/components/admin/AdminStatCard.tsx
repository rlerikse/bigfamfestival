import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ label, value, icon, accent }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.value, { color: accent ?? theme.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    margin: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
