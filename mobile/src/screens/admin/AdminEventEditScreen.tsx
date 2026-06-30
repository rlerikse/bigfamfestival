/**
 * AdminEventEditScreen — Create or edit a festival event.
 *
 * UX improvements (Sprint 4B):
 * - Date field → custom date picker modal
 * - Start/end time fields → custom time picker modal
 * - Stage field → dropdown (fixed set of stages)
 * - Description → multiline paragraph input (taller, scrollable)
 * - Genres → tag-style input (select existing or add new)
 * - Image URL → photo manager (pick from library, upload to Firebase Storage)
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { createAdminEvent, updateAdminEvent, AdminEvent } from '../../services/adminService';
import { fetchEvents } from '../../services/eventsService';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getIdToken } from '../../services/firebaseAuthService';

// ── Constants ─────────────────────────────────────────────────────────────

const STAGES = ['Apogee', 'The Bayou', 'The Gallery'];

const COMMON_GENRES = [
  'House', 'Techno', 'Drum & Bass', 'Jungle', 'Garage',
  'Dancehall', 'Afrobeats', 'Hip-Hop', 'R&B', 'Soul',
  'Electronic', 'Ambient', 'Disco', 'Funk', 'Reggae',
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Types ─────────────────────────────────────────────────────────────────

type RouteParams = { eventId?: string };

interface FormState {
  name: string;
  stage: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  description: string;
  imageUrl: string;
  genres: string[];
  artists: string[];
}

type PickerMode = 'date' | 'startTime' | 'endTime' | null;

// ── Helpers ───────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

function parseTimeParts(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2 && parts.every(p => !isNaN(p))) {
    return { hour: parts[0], minute: parts[1] };
  }
  return { hour: 12, minute: 0 };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ── Date / Time Picker Modal ──────────────────────────────────────────────

interface DateTimePickerModalProps {
  mode: 'date' | 'time';
  visible: boolean;
  initialDate?: string;   // YYYY-MM-DD
  initialTime?: string;   // HH:MM
  onConfirm: (value: string) => void;
  onCancel: () => void;
  theme: any;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  mode, visible, initialDate, initialTime, onConfirm, onCancel, theme,
}) => {
  const isDate = mode === 'date';

  // Date state
  const today = new Date();
  const initDate = parseDateParts(initialDate ?? '');
  const initTime = parseTimeParts(initialTime ?? '');

  const [year, setYear] = useState(initDate.year);
  const [month, setMonth] = useState(initDate.month);
  const [day, setDay] = useState(initDate.day);
  const [hour, setHour] = useState(initTime.hour);
  const [minute, setMinute] = useState(initTime.minute);

  useEffect(() => {
    if (visible) {
      if (isDate) {
        const d = parseDateParts(initialDate ?? '');
        setYear(d.year); setMonth(d.month); setDay(d.day);
      } else {
        const t = parseTimeParts(initialTime ?? '');
        setHour(t.hour); setMinute(t.minute);
      }
    }
  }, [visible, initialDate, initialTime]);

  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(day, maxDay);

  const handleConfirm = () => {
    if (isDate) {
      onConfirm(`${year}-${pad(month)}-${pad(clampedDay)}`);
    } else {
      onConfirm(`${pad(hour)}:${pad(minute)}`);
    }
  };

  const Stepper = ({
    label, value, onDec, onInc, minVal, maxVal, display,
  }: {
    label: string;
    value: number;
    onDec: () => void;
    onInc: () => void;
    minVal: number;
    maxVal: number;
    display?: string;
  }) => (
    <View style={pickerStyles.stepperCol}>
      <Text style={[pickerStyles.stepperLabel, { color: theme.muted }]}>{label}</Text>
      <View style={pickerStyles.stepperRow}>
        <TouchableOpacity
          style={[pickerStyles.stepBtn, { borderColor: theme.border }]}
          onPress={onDec}
          disabled={value <= minVal}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Ionicons name="chevron-down" size={18} color={value <= minVal ? theme.muted : theme.text} />
        </TouchableOpacity>
        <Text style={[pickerStyles.stepperValue, { color: theme.text }]}>
          {display ?? pad(value)}
        </Text>
        <TouchableOpacity
          style={[pickerStyles.stepBtn, { borderColor: theme.border }]}
          onPress={onInc}
          disabled={value >= maxVal}
          accessibilityLabel={`Increase ${label}`}
        >
          <Ionicons name="chevron-up" size={18} color={value >= maxVal ? theme.muted : theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[pickerStyles.title, { color: theme.text }]}>
            {isDate ? 'Select Date' : 'Select Time'}
          </Text>

          <View style={pickerStyles.steppers}>
            {isDate ? (
              <>
                <Stepper
                  label="YEAR"
                  value={year}
                  minVal={today.getFullYear()}
                  maxVal={today.getFullYear() + 5}
                  onDec={() => setYear(y => Math.max(today.getFullYear(), y - 1))}
                  onInc={() => setYear(y => Math.min(today.getFullYear() + 5, y + 1))}
                  display={String(year)}
                />
                <Stepper
                  label="MONTH"
                  value={month}
                  minVal={1}
                  maxVal={12}
                  onDec={() => setMonth(m => Math.max(1, m - 1))}
                  onInc={() => setMonth(m => Math.min(12, m + 1))}
                  display={MONTHS[month - 1]}
                />
                <Stepper
                  label="DAY"
                  value={clampedDay}
                  minVal={1}
                  maxVal={maxDay}
                  onDec={() => setDay(d => Math.max(1, d - 1))}
                  onInc={() => setDay(d => Math.min(maxDay, d + 1))}
                />
              </>
            ) : (
              <>
                <Stepper
                  label="HOUR"
                  value={hour}
                  minVal={0}
                  maxVal={23}
                  onDec={() => setHour(h => Math.max(0, h - 1))}
                  onInc={() => setHour(h => Math.min(23, h + 1))}
                />
                <Text style={[pickerStyles.timeSep, { color: theme.text }]}>:</Text>
                <Stepper
                  label="MIN"
                  value={minute}
                  minVal={0}
                  maxVal={59}
                  onDec={() => setMinute(m => Math.max(0, m - 1))}
                  onInc={() => setMinute(m => Math.min(59, m + 1))}
                />
              </>
            )}
          </View>

          <View style={pickerStyles.actions}>
            <TouchableOpacity
              style={[pickerStyles.cancelBtn, { borderColor: theme.border }]}
              onPress={onCancel}
              accessibilityLabel="Cancel"
            >
              <Text style={[pickerStyles.cancelTxt, { color: theme.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pickerStyles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={handleConfirm}
              accessibilityLabel="Confirm selection"
            >
              <Text style={pickerStyles.confirmTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  steppers: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 28,
  },
  stepperCol: {
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  stepperRow: {
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'center',
    letterSpacing: 1,
  },
  timeSep: {
    fontSize: 28,
    fontWeight: '700',
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelTxt: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

// ── Stage Dropdown ────────────────────────────────────────────────────────

interface StageDropdownProps {
  value: string;
  onChange: (v: string) => void;
  theme: any;
}

const StageDropdown: React.FC<StageDropdownProps> = ({ value, onChange, theme }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[dropStyles.trigger, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Select stage"
        accessibilityRole="button"
      >
        <Text style={[dropStyles.triggerText, { color: value ? theme.text : theme.muted }]}>
          {value || 'Select a stage…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={dropStyles.overlay}
          onPress={() => setOpen(false)}
          activeOpacity={1}
          accessibilityLabel="Close stage picker"
        >
          <View style={[dropStyles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[dropStyles.sheetTitle, { color: theme.text }]}>Select Stage</Text>
            {STAGES.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  dropStyles.option,
                  { borderBottomColor: theme.border },
                  s === value && { backgroundColor: `${theme.primary}22` },
                ]}
                onPress={() => { onChange(s); setOpen(false); }}
                accessibilityLabel={`Stage: ${s}`}
                accessibilityRole="menuitem"
              >
                <Text style={[dropStyles.optionText, { color: theme.text }, s === value && { fontWeight: '700', color: theme.primary }]}>
                  {s}
                </Text>
                {s === value && <Ionicons name="checkmark" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const dropStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
    opacity: 0.6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
  },
});

// ── Reusable Tag Input (shared by genres + artists) ─────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  theme: any;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, suggestions = [], theme }) => {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const filteredSuggestions = suggestions.filter(s =>
    !value.includes(s) &&
    s.toLowerCase().includes(trimmed.toLowerCase())
  );

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !value.includes(clean)) {
      onChange([...value, clean]);
    }
    setQuery('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const showAddNew = trimmed.length > 0 &&
    !suggestions.map(s => s.toLowerCase()).includes(trimmed.toLowerCase()) &&
    !value.includes(trimmed);

  return (
    <View>
      <View style={tagStyles.tagsWrap}>
        {value.map(t => (
          <View key={t} style={[tagStyles.tag, { backgroundColor: `${theme.primary}28`, borderColor: `${theme.primary}55` }]}>
            <Text style={[tagStyles.tagText, { color: theme.primary }]}>{t}</Text>
            <TouchableOpacity
              onPress={() => removeTag(t)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityLabel={`Remove ${t}`}
            >
              <Ionicons name="close-circle" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TextInput
        style={[tagStyles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => { if (trimmed) addTag(trimmed); }}
        returnKeyType="done"
        accessibilityLabel={placeholder}
      />
      {(filteredSuggestions.length > 0 || showAddNew) && (
        <View style={[tagStyles.suggestions, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {filteredSuggestions.slice(0, 6).map(s => (
            <TouchableOpacity
              key={s}
              style={[tagStyles.suggestionRow, { borderBottomColor: theme.border }]}
              onPress={() => addTag(s)}
              accessibilityLabel={`Add ${s}`}
            >
              <Ionicons name="add-circle-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[tagStyles.suggestionText, { color: theme.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
          {showAddNew && (
            <TouchableOpacity
              style={[tagStyles.suggestionRow, { borderBottomColor: 'transparent' }]}
              onPress={() => addTag(trimmed)}
              accessibilityLabel={`Add "${trimmed}"`}
            >
              <Ionicons name="add-circle" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[tagStyles.suggestionText, { color: theme.primary, fontStyle: 'italic' }]}>
                {`Add "${trimmed}"`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ── Genre Tag Input ───────────────────────────────────────────────────────

// Convenience wrappers for specific field contexts
const GenreTagInput: React.FC<{ value: string[]; onChange: (v: string[]) => void; theme: any }> = ({ value, onChange, theme }) => (
  <TagInput value={value} onChange={onChange} placeholder="Search genres or type new…" suggestions={COMMON_GENRES} theme={theme} />
);

const tagStyles = StyleSheet.create({
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 14,
  },
});

// ── Image Manager ─────────────────────────────────────────────────────────

interface ImageManagerProps {
  value: string;
  onChange: (url: string) => void;
  theme: any;
}

const ImageManager: React.FC<ImageManagerProps> = ({ value, onChange, theme }) => {
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload an event image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png'
        : uri.toLowerCase().endsWith('.webp') ? 'image/webp'
        : 'image/jpeg';

      const response = await fetch(uri);
      const blob = await response.blob();

      if (blob.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image is too large. Please choose a photo under 5 MB.');
      }

      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const filename = `event-images/${Date.now()}.${ext}`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob, { contentType: mimeType });
      const downloadUrl = await getDownloadURL(storageRef);
      onChange(downloadUrl);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Image', 'Clear the event image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onChange('') },
    ]);
  };

  return (
    <View>
      {value ? (
        <View style={imgStyles.preview}>
          <Image source={{ uri: value }} style={imgStyles.previewImg} resizeMode="cover" />
          <View style={imgStyles.previewOverlay}>
            <TouchableOpacity
              style={[imgStyles.imgBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
              onPress={handlePick}
              accessibilityLabel="Change event image"
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={imgStyles.imgBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[imgStyles.imgBtn, { backgroundColor: 'rgba(200,40,40,0.8)' }]}
              onPress={handleRemove}
              accessibilityLabel="Remove event image"
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={imgStyles.imgBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[imgStyles.placeholder, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={handlePick}
          disabled={uploading}
          accessibilityLabel="Upload event image"
          accessibilityRole="button"
        >
          {uploading ? (
            <>
              <ActivityIndicator color={theme.primary} />
              <Text style={[imgStyles.placeholderText, { color: theme.muted }]}>Uploading…</Text>
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={theme.muted} />
              <Text style={[imgStyles.placeholderText, { color: theme.muted }]}>Tap to upload image</Text>
              <Text style={[imgStyles.placeholderSub, { color: theme.muted }]}>16:9 · JPEG, PNG, or WebP · Max 5 MB</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {uploading && value === '' && null}
    </View>
  );
};

const imgStyles = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  preview: {
    borderRadius: 10,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  imgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  imgBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  name: '', stage: '', date: '', startTime: '', endTime: '',
  description: '', imageUrl: '', genres: [], artists: [],
};

export const AdminEventEditScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params ?? {};
  const isEdit = !!eventId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

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
          genres: Array.isArray(ev.genres) ? ev.genres : [],
          artists: Array.isArray(ev.artists) ? ev.artists : [],
        });
      } catch (e: any) {
        Alert.alert('Error', e.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.stage.trim() || !form.date.trim()) {
      Alert.alert('Validation', 'Name, stage, and date are required.');
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
        genres: form.genres.length > 0 ? form.genres : undefined,
        artists: form.artists.length > 0 ? form.artists : undefined,
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

  // ── Date/Time picker helpers ──
  const openPicker = (mode: PickerMode) => setPickerMode(mode);
  const closePicker = () => setPickerMode(null);

  const formatDisplayDate = (d: string) => {
    if (!d) return 'Not set';
    const [y, m, day] = d.split('-');
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${MONTHS[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const activeDateStr = pickerMode === 'startTime' ? undefined : form.date;
  const activeTimeStr = pickerMode === 'startTime' ? form.startTime : form.endTime;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'Edit Event' : 'New Event'}</Text>

        {/* Event Name */}
        <Text style={[styles.label, { color: theme.muted }]}>Event Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g. DJ Set — Main Stage"
          placeholderTextColor={theme.muted}
          value={form.name}
          onChangeText={v => set('name', v)}
          accessibilityLabel="Event name"
        />

        {/* Stage Dropdown */}
        <Text style={[styles.label, { color: theme.muted }]}>Stage *</Text>
        <StageDropdown value={form.stage} onChange={v => set('stage', v)} theme={theme} />

        {/* Date Picker */}
        <Text style={[styles.label, { color: theme.muted }]}>Date *</Text>
        <TouchableOpacity
          style={[styles.pickerTrigger, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => openPicker('date')}
          accessibilityLabel="Select event date"
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={18} color={theme.muted} style={{ marginRight: 8 }} />
          <Text style={[styles.pickerTriggerText, { color: form.date ? theme.text : theme.muted }]}>
            {form.date ? formatDisplayDate(form.date) : 'Tap to select date…'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.muted} />
        </TouchableOpacity>

        {/* Time Row */}
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>Start Time</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openPicker('startTime')}
              accessibilityLabel="Select start time"
              accessibilityRole="button"
            >
              <Ionicons name="time-outline" size={16} color={theme.muted} style={{ marginRight: 6 }} />
              <Text style={[styles.pickerTriggerText, { color: form.startTime ? theme.text : theme.muted }]}>
                {form.startTime || '—'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.muted }]}>End Time</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openPicker('endTime')}
              accessibilityLabel="Select end time"
              accessibilityRole="button"
            >
              <Ionicons name="time-outline" size={16} color={theme.muted} style={{ marginRight: 6 }} />
              <Text style={[styles.pickerTriggerText, { color: form.endTime ? theme.text : theme.muted }]}>
                {form.endTime || '—'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description — multiline */}
        <Text style={[styles.label, { color: theme.muted }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Optional — describe the act, set, or event…"
          placeholderTextColor={theme.muted}
          value={form.description}
          onChangeText={v => set('description', v)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          accessibilityLabel="Event description"
        />

        {/* Genres Tag Input */}
        <Text style={[styles.label, { color: theme.muted }]}>Genres</Text>
        <GenreTagInput value={form.genres} onChange={v => set('genres', v)} theme={theme} />

        {/* Artists Tag Input */}
        <Text style={[styles.label, { color: theme.muted }]}>Artists</Text>
        <TagInput
          value={form.artists}
          onChange={v => set('artists', v)}
          placeholder="Type artist name and press return…"
          theme={theme}
        />

        {/* Image Manager */}
        <Text style={[styles.label, { color: theme.muted }]}>Event Image</Text>
        <ImageManager value={form.imageUrl} onChange={v => set('imageUrl', v)} theme={theme} />

        {/* Save Button */}
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

      {/* Date Picker Modal */}
      {pickerMode === 'date' && (
        <DateTimePickerModal
          mode="date"
          visible
          initialDate={form.date}
          onConfirm={v => { set('date', v); closePicker(); }}
          onCancel={closePicker}
          theme={theme}
        />
      )}

      {/* Start Time Modal */}
      {pickerMode === 'startTime' && (
        <DateTimePickerModal
          mode="time"
          visible
          initialTime={form.startTime}
          onConfirm={v => { set('startTime', v); closePicker(); }}
          onCancel={closePicker}
          theme={theme}
        />
      )}

      {/* End Time Modal */}
      {pickerMode === 'endTime' && (
        <DateTimePickerModal
          mode="time"
          visible
          initialTime={form.endTime}
          onConfirm={v => { set('endTime', v); closePicker(); }}
          onCancel={closePicker}
          theme={theme}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 10,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerTriggerText: {
    fontSize: 15,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});