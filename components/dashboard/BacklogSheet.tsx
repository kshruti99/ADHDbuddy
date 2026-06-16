import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Archive, ChevronRight, Plus, X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ENERGY_EMOJI, ENERGY_LABELS, type EnergyTag } from '@/lib/constants';
import type { BacklogItem, FocusItem } from '@/lib/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  backlogItems: BacklogItem[];
  focusItems: FocusItem[];
  onAddBacklog: (text: string, energy: EnergyTag) => void;
  onPromoteToFocus: (item: BacklogItem, count: number, onOverflow: (c: string) => void) => void;
  onSetOverflow: (content: string) => void;
  onReloadFocus: () => void;
}

const ENERGY_OPTIONS: EnergyTag[] = ['quick_win', 'deep_focus', 'boring_grind'];

export function BacklogSheet({
  visible,
  onClose,
  backlogItems,
  focusItems,
  onAddBacklog,
  onPromoteToFocus,
  onSetOverflow,
  onReloadFocus,
}: Props) {
  const [input, setInput] = useState('');
  const [energy, setEnergy] = useState<EnergyTag>('quick_win');

  async function handleAdd() {
    if (!input.trim()) return;
    onAddBacklog(input.trim(), energy);
    setInput('');
  }

  async function handlePromote(item: BacklogItem) {
    await onPromoteToFocus(item, focusItems.length, (content) => onSetOverflow(content));
    await onReloadFocus();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Archive size={18} color={colors.accent} strokeWidth={2} />
            <Text style={styles.title}>Backlog Vault</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Add to backlog */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Add to backlog..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!input.trim()}
              activeOpacity={0.8}>
              <Plus size={18} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Energy tag row */}
          <View style={styles.energyRow}>
            {ENERGY_OPTIONS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.energyChip, energy === tag && styles.energyChipActive]}
                onPress={() => setEnergy(tag)}
                activeOpacity={0.8}>
                <Text style={[styles.energyChipText, energy === tag && styles.energyChipTextActive]}>
                  {ENERGY_EMOJI[tag]} {ENERGY_LABELS[tag]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Backlog list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {backlogItems.length === 0 && (
              <Text style={styles.empty}>Your backlog vault is empty.</Text>
            )}
            {backlogItems.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemEnergy}>
                    {ENERGY_EMOJI[item.energy_tag]}
                  </Text>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
                {focusItems.length < 3 && (
                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={() => handlePromote(item)}
                    activeOpacity={0.8}>
                    <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
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
    maxHeight: '80%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.35 },
  energyRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  energyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  energyChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  energyChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  energyChipTextActive: { color: colors.primaryLight },
  list: { maxHeight: 300 },
  empty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  itemInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemEnergy: { fontSize: 16 },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  promoteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
