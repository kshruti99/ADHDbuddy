import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Brain, ChevronRight, Coffee, Sparkles, Zap } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { BacklogItem } from '@/lib/supabase';
import type { EnergyTag, WizardStep } from '@/lib/constants';

type Props = {
  step: WizardStep;
  choices: BacklogItem[];
  onClose: () => void;
  onPickEnergy: (energy: EnergyTag) => void;
  onPickChoice: (item: BacklogItem) => void;
};

export function HelpMePickModal({ step, choices, onClose, onPickEnergy, onPickChoice }: Props) {
  if (step === 'closed') return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Sparkles size={20} color={colors.accent} strokeWidth={2} />
            <Text style={styles.title}>Help Me Pick</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Done</Text>
            </TouchableOpacity>
          </View>

          {step === 'energy' && (
            <View style={styles.body}>
              <Text style={styles.question}>What is your mental energy level right now?</Text>
              <TouchableOpacity style={styles.pickBtn} onPress={() => onPickEnergy('quick_win')} activeOpacity={0.8}>
                <Zap size={18} color={colors.accent} strokeWidth={2} />
                <Text style={styles.pickText}>Ready for a Quick Win</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={() => onPickEnergy('deep_focus')} activeOpacity={0.8}>
                <Brain size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.pickText}>In Deep Focus Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={() => onPickEnergy('boring_grind')} activeOpacity={0.8}>
                <Coffee size={18} color={colors.textSecondary} strokeWidth={2} />
                <Text style={styles.pickText}>Dragging through a Boring Grind</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'pick' && (
            <View style={styles.body}>
              <Text style={styles.question}>
                If you could only finish ONE of these today, which one relieves the most pressure?
              </Text>
              {choices.length === 0 && (
                <Text style={styles.empty}>
                  No matching items in your Brain Backlog for this energy level. Try adding some first!
                </Text>
              )}
              {choices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.choiceBtn}
                  onPress={() => onPickChoice(item)}
                  activeOpacity={0.8}>
                  <Text style={styles.choiceText}>{item.content}</Text>
                  <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.skipBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.skipText}>Neither — skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
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
  body: { gap: 12 },
  question: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  pickText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textMuted, lineHeight: 20 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  choiceText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
});
