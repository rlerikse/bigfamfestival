import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { sendAdminNotification } from '../../services/adminService';

const USER_GROUPS = ['all', 'attendee', 'staff', 'artist', 'director', 'vendor', 'volunteer', 'admin'];

export const AdminNotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ title: string; group: string; at: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Title and message body are required');
      return;
    }
    Alert.alert(
      'Confirm Send',
      `Send "${title}" to group: ${selectedGroup}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              await sendAdminNotification({
                title: title.trim(),
                body: body.trim(),
                targetGroup: selectedGroup === 'all' ? undefined : selectedGroup,
              });
              setLastSent({ title: title.trim(), group: selectedGroup, at: new Date().toLocaleTimeString() });
              setTitle('');
              setBody('');
              Alert.alert('Sent ✓', `Notification sent to "${selectedGroup}"`);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to send');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: theme.text }]}>Send Notification</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        Target a group or send to all attendees
      </Text>

      {/* Group selector */}
      <Text style={[styles.label, { color: theme.muted }]}>Target Group</Text>
      <View style={styles.groupGrid}>
        {USER_GROUPS.map(g => (
          <TouchableOpacity
            key={g}
            style={[
              styles.groupChip,
              {
                borderColor: selectedGroup === g ? theme.primary : theme.border,
                backgroundColor: selectedGroup === g ? theme.primary + '22' : theme.card,
              },
            ]}
            onPress={() => setSelectedGroup(g)}
            accessibilityLabel={`Target group ${g}`}
          >
            <Text style={[styles.groupChipText, { color: selectedGroup === g ? theme.primary : theme.text }]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={[styles.label, { color: theme.muted }]}>Title *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Notification title"
        placeholderTextColor={theme.muted}
        maxLength={100}
        accessibilityLabel="Notification title"
      />
      <Text style={[styles.charCount, { color: theme.muted }]}>{title.length}/100</Text>

      {/* Body */}
      <Text style={[styles.label, { color: theme.muted }]}>Message *</Text>
      <TextInput
        style={[styles.textarea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        value={body}
        onChangeText={setBody}
        placeholder="Notification body"
        placeholderTextColor={theme.muted}
        multiline
        numberOfLines={4}
        maxLength={500}
        accessibilityLabel="Notification body"
      />
      <Text style={[styles.charCount, { color: theme.muted }]}>{body.length}/500</Text>

      {/* Last sent banner */}
      {lastSent && (
        <View style={[styles.sentBanner, { backgroundColor: '#10b981' + '22', borderColor: '#10b981' }]}>
          <Text style={[styles.sentText, { color: '#10b981' }]}>
            ✓ Sent &quot;{lastSent.title}&quot; → {lastSent.group} at {lastSent.at}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: theme.primary }, sending && { opacity: 0.7 }]}
        onPress={handleSend}
        disabled={sending}
        accessibilityLabel="Send notification"
      >
        {sending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.sendBtnText}>🔔  Send Notification</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  label: { fontSize: 13, marginTop: 16, marginBottom: 6 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  groupChipText: { fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  sentBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sentText: { fontSize: 13, fontWeight: '500' },
  sendBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AdminNotificationsScreen;
