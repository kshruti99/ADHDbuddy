import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Clock, Save } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { AnchorItem } from '@/lib/supabase';
type Props = {
  visible: boolean;
  editing: AnchorItem | null;
  onClose: () => void;
  onSave: (title: string, timeText: string, commute: number, prep: number) => Promise<boolean>;
  onRemove?: () => void;
};

export function AnchorEditorModal({ visible, editing, onClose, onSave, onRemove }: Props) {
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('PM');
  const [commute, setCommute] = useState('15');
  const [prep, setPrep] = useState('10');

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCommute(String(editing.commute_min));
      setPrep(String(editing.prep_min));
      const match = editing.anchor_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        setHour(match[1]);
        setMinute(match[2]);
        setMeridiem((match[3]?.toUpperCase() as 'AM' | 'PM') || 'PM');
      }
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 60);
      setTitle('');
      setHour(String(now.getHours() % 12 || 12));
      setMinute(now.getMinutes().toString().padStart(2, '0'));
      setMeridiem(now.getHours() >= 12 ? 'PM' : 'AM');
      setCommute('15');
      setPrep('10');
    }
  }, [editing, visible]);

  const timeText = `${hour}:${minute} ${meridiem}`;
  const canSave = title.trim().length > 0;

  async function handleSave() {
    const ok = await onSave(title, timeText, parseInt(commute, 10) || 0, parseInt(prep, 10) || 0);
    if (ok) onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Clock size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.title}>{editing ? 'Edit event' : 'New event'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Event name</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Doctor appointment"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={hour}
                  onChangeText={setHour}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.colon}>:</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={minute}
                  onChangeText={setMinute}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <View style={styles.meridiemRow}>
                  {(['AM', 'PM'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.meridiemBtn, meridiem === m && styles.meridiemActive]}
                      onPress={() => setMeridiem(m)}>
                      <Text style={[styles.meridiemText, meridiem === m && styles.meridiemTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Commute (min)</Text>
                <TextInput
                  style={styles.input}
                  value={commute}
                  onChangeText={setCommute}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prep (min)</Text>
                <TextInput
                  style={styles.input}
                  value={prep}
                  onChangeText={setPrep}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}>
              <Save size={16} color={canSave ? colors.black : colors.textMuted} strokeWidth={2.5} />
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                {editing ? 'Update event' : 'Add to calendar'}
              </Text>
            </TouchableOpacity>

            {editing && onRemove && (
              <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
                <Text style={styles.removeText}>Remove from today</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  close: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.primary },
  body: { gap: 16 },
  fieldGroup: { gap: 6 },
  fieldRow: { flexDirection: 'row' },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: { width: 52, textAlign: 'center' },
  colon: { fontSize: 18, color: colors.textMuted },
  meridiemRow: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  meridiemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  meridiemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  meridiemText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  meridiemTextActive: { color: colors.primaryLight },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: colors.surfaceHighlight },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.black },
  saveBtnTextDisabled: { color: colors.textMuted },
  removeBtn: { alignItems: 'center', paddingVertical: 12 },
  removeText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.accentWarm },
});
