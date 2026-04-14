import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { createAdminEvent, updateAdminEvent, AdminEvent } from '../../services/adminService';
import { fetchEvents } from "../../services/eventsService";

type RouteParams = { eventId?: string };

interface FormState {
  name: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  imageUrl: string;
  genres: string;
  artists: string;
}

const EMPTY_FORM: FormState = {
  name: '', stage: '', date: '', startTime: '', endTime: '',
  description: '', imageUrl: '', genres: '', artists: '',
};

export const AdminEventEditScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params ?? {};
  const isEdit = !!eventId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { events } = await fetchEvents();
        const ev = events.find((e: any) => e.id === eventId);
        if (!ev) throw new Error('Event not found');
        setForm({
          name: ev.name ?? '',
          stage: ev.stage ?? '',
          date: ev.date ?? '',
          startTime: ev.startTime ?? '',
          endTime: ev.endTime ?? '',
          description: ev.description ?? '',
          imageUrl: ev.imageUrl ?? '',
          genres: (ev.genres ?? []).join(', '),
          artists: (ev.artists ?? []).join(', '),
        });
      } catch (e: any) {
        Alert.alert('Error', e.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChangeText: (v: string) => setForm(prev => ({ ...prev, [key]: v })),
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.stage.trim() || !form.date.trim()) {
      Alert.alert('Validation', 'Name, stage, and date are required');
      return;
    }
    setSaving(true);
    try {
      const dto = {
        name: form.name.trim(),
        stage: form.stage.trim(),
        date: form.date.trim(),
        startTime: form.startTime.trim(),
        endTime: form.endTime.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        genres: form.genres ? form.genres.split(',').map(g => g.trim()).filter(Boolean) : undefined,
        artists: form.artists ? form.artists.split(',').map(a => a.trim()).filter(Boolean) : undefined,
      };
      if (isEdit) {
        await updateAdminEvent(eventId!, dto);
      } else {
        await createAdminEvent(dto as any);
      }
      Alert.alert('Success', isEdit ? 'Event updated' : 'Event created');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'Edit Event' : 'New Event'}</Text>

      {[
        { label: 'Event Name *', key: 'name' as const, placeholder: 'e.g. DJ Set — Main Stage' },
        { label: 'Stage *', key: 'stage' as const, placeholder: 'e.g. Main Stage' },
        { label: 'Date * (YYYY-MM-DD)', key: 'date' as const, placeholder: '2025-08-15' },
        { label: 'Start Time (HH:MM)', key: 'startTime' as const, placeholder: '14:00' },
        { label: 'End Time (HH:MM)', key: 'endTime' as const, placeholder: '16:00' },
        { label: 'Description', key: 'description' as const, placeholder: 'Optional description' },
        { label: 'Image URL', key: 'imageUrl' as const, placeholder: 'https://…' },
        { label: 'Genres (comma-separated)', key: 'genres' as const, placeholder: 'House, Techno' },
        { label: 'Artists (comma-separated)', key: 'artists' as const, placeholder: 'DJ A, DJ B' },
      ].map(({ label, key, placeholder }) => (
        <View key={key}>
          <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            {...field(key)}
            accessibilityLabel={label}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel={isEdit ? 'Save event changes' : 'Create event'}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Event'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, marginTop: 14, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  saveBtn: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
