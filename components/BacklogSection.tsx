import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Circle, Expand } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ENERGY_EMOJI, ENERGY_LABELS, type EnergyTag } from '@/lib/constants';
import { SoftActionRow } from '@/components/SoftActionRow';
import type { BacklogItem } from '@/lib/supabase';

type Props = {
  items: BacklogItem[];
  input: string;
  energy: EnergyTag;
  onInputChange: (v: string) => void;
  onEnergyChange: (e: EnergyTag) => void;
  onAdd: () => void;
  onToggle: (item: BacklogItem) => void;
  onDone: (item: BacklogItem) => void;
  onLater: (item: BacklogItem) => void;
  onPromote: (item: BacklogItem) => void;
  onHelpMePick: () => void;
};

export function BacklogSection({
  items,
  input,
  energy,
  onInputChange,
  onEnergyChange,
  onAdd,
  onToggle,
  onDone,
  onLater,
  onPromote,
  onHelpMePick,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? items : items.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Brain Backlog</Text>
        <Text style={styles.count}>{items.length} items</Text>
      </View>

      {displayed.map((item) => (
        <SoftActionRow key={item.id} onDone={() => onDone(item)} onLater={() => onLater(item)}>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => onToggle(item)} activeOpacity={0.7} style={styles.check}>
              <Circle size={18} color={colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.content}>
              <Text style={styles.text}>{item.content}</Text>
              <Text style={styles.tag}>
                {ENERGY_EMOJI[item.energy_tag]} {ENERGY_LABELS[item.energy_tag]}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onPromote(item)} style={styles.promote} activeOpacity={0.7}>
              <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </SoftActionRow>
      ))}

      {items.length === 0 && (
        <Text style={styles.empty}>Nothing here yet. Dump everything here — no sorting required.</Text>
      )}

      {items.length > 3 && (
        <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded((e) => !e)} activeOpacity={0.7}>
          <Expand size={14} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.expandText}>
            {expanded ? 'Show less' : `See all ${items.length} items`}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputSection}>
        <View style={styles.energyPicker}>
          {(['quick_win', 'deep_focus', 'boring_grind'] as EnergyTag[]).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, energy === tag && styles.chipActive]}
              onPress={() => onEnergyChange(tag)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, energy === tag && styles.chipTextActive]}>
                {ENERGY_EMOJI[tag]} {ENERGY_LABELS[tag]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={onInputChange}
          placeholder="+ Add to backlog..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
      </View>

      {items.length > 0 && (
        <TouchableOpacity style={styles.helpBtn} onPress={onHelpMePick} activeOpacity={0.8}>
          <Text style={styles.helpText}>Help Me Pick</Text>
        </TouchableOpacity>
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
  count: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 8,
    backgroundColor: colors.surface,
  },
  check: { padding: 2 },
  content: { flex: 1, gap: 2 },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  tag: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  promote: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  empty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
    lineHeight: 20,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  inputSection: { marginTop: 8, gap: 8 },
  energyPicker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  chipText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  chipTextActive: { color: colors.primaryLight },
  input: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  helpBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    borderStyle: 'dashed',
  },
  helpText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent },
});
