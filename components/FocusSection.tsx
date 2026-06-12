import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckCircle, Circle, MoveRight, Sparkles } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { SoftActionRow } from '@/components/SoftActionRow';
import type { FocusItem } from '@/lib/supabase';

type Props = {
  active: FocusItem[];
  completed: FocusItem[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onToggle: (item: FocusItem) => void;
  onDone: (item: FocusItem) => void;
  onLater: (item: FocusItem) => void;
  onHelpMePick: () => void;
  showHelpMePick: boolean;
  overflow: string | null;
  onMoveOverflowToBacklog: (content: string) => void;
  onDismissOverflow: () => void;
};

export function FocusSection({
  active,
  completed,
  input,
  onInputChange,
  onAdd,
  onToggle,
  onDone,
  onLater,
  onHelpMePick,
  showHelpMePick,
  overflow,
  onMoveOverflowToBacklog,
  onDismissOverflow,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Focus</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{active.length}/3</Text>
        </View>
      </View>

      {active.map((item) => (
        <SoftActionRow key={item.id} onDone={() => onDone(item)} onLater={() => onLater(item)}>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => onToggle(item)} activeOpacity={0.7} style={styles.check}>
              <Circle size={22} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.text}>{item.content}</Text>
          </View>
        </SoftActionRow>
      ))}

      {completed.map((item) => (
        <SoftActionRow key={item.id} onDone={() => onDone(item)}>
          <View style={[styles.row, styles.rowDone]}>
            <TouchableOpacity onPress={() => onToggle(item)} activeOpacity={0.7} style={styles.check}>
              <CheckCircle size={22} color={colors.success} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.textDone}>{item.content}</Text>
          </View>
        </SoftActionRow>
      ))}

      {active.length < 3 && (
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={onInputChange}
          placeholder="+ Add a focus item..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
      )}

      {showHelpMePick && (
        <TouchableOpacity style={styles.helpBtn} onPress={onHelpMePick} activeOpacity={0.8}>
          <Sparkles size={16} color={colors.accent} strokeWidth={2} />
          <Text style={styles.helpText}>Help Me Pick</Text>
        </TouchableOpacity>
      )}

      {overflow && (
        <View style={styles.overflow}>
          <View style={styles.overflowHeader}>
            <AlertTriangle size={16} color={colors.accent} strokeWidth={2} />
            <Text style={styles.overflowTitle}>Your current focus is full!</Text>
          </View>
          <Text style={styles.overflowBody}>
            Would you like to save &quot;{overflow}&quot; to your Brain Backlog instead?
          </Text>
          <View style={styles.overflowActions}>
            <TouchableOpacity
              style={styles.overflowYes}
              onPress={() => onMoveOverflowToBacklog(overflow)}
              activeOpacity={0.8}>
              <MoveRight size={14} color={colors.black} strokeWidth={2.5} />
              <Text style={styles.overflowYesText}>Yes, move to Backlog</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismissOverflow} style={styles.overflowNo}>
              <Text style={styles.overflowNoText}>No thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  badge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primaryLight },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingRight: 8, backgroundColor: colors.surface },
  rowDone: { opacity: 0.5 },
  check: { padding: 2 },
  text: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary, lineHeight: 22 },
  textDone: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  input: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    borderStyle: 'dashed',
  },
  helpText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent },
  overflow: {
    marginTop: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    padding: 14,
    gap: 8,
  },
  overflowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overflowTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent },
  overflowBody: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  overflowActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  overflowYes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  overflowYesText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.black },
  overflowNo: { paddingVertical: 8, paddingHorizontal: 14 },
  overflowNoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
});
