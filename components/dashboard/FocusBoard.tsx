import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Lightbulb, Plus, Sparkles } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { FocusBlockCard } from '@/components/dashboard/FocusBlockCard';
import { HelpMePickModal } from '@/components/modals/HelpMePickModal';
import type { FocusItem, BacklogItem } from '@/lib/supabase';
import type { EnergyTag, WizardStep } from '@/lib/constants';

interface Props {
  items: FocusItem[];
  backlogIncomplete: BacklogItem[];
  focusCount: number;
  onLaunch: (item: FocusItem) => void;
  onAddFocus: (text: string) => void;
  onSetOverflow: (content: string) => void;
  onPromoteToFocus: (item: BacklogItem, count: number, onOverflow: (c: string) => void) => void;
  onReloadFocus: () => void;
  onOpenUnstuck: () => void;
}

export function FocusBoard({
  items,
  backlogIncomplete,
  focusCount,
  onLaunch,
  onAddFocus,
  onSetOverflow,
  onPromoteToFocus,
  onReloadFocus,
  onOpenUnstuck,
}: Props) {
  const [capture, setCapture] = useState('');
  const [wizardStep, setWizardStep] = useState<WizardStep>('closed');
  const [wizardChoices, setWizardChoices] = useState<BacklogItem[]>([]);

  function handleAddCapture() {
    const text = capture.trim();
    if (!text) return;
    onAddFocus(text);
    setCapture('');
  }

  function startWizard() {
    setWizardStep('energy');
    setWizardChoices([]);
  }

  function pickEnergy(energy: EnergyTag) {
    const matches = backlogIncomplete.filter((b) => b.energy_tag === energy);
    const shuffled = [...matches].sort(() => Math.random() - 0.5);
    setWizardChoices(shuffled.slice(0, 2));
    setWizardStep('pick');
  }

  async function pickChoice(item: BacklogItem) {
    await onPromoteToFocus(item, focusCount, (content) => onSetOverflow(content));
    await onReloadFocus();
    setWizardStep('closed');
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerLabel}>CURRENT FOCUS ({focusCount}/3)</Text>
          <TouchableOpacity style={styles.unstuckBtn} onPress={onOpenUnstuck} activeOpacity={0.8}>
            <Lightbulb size={15} color={colors.primary} strokeWidth={2} />
            <Text style={styles.unstuckBtnText}>I'm stuck</Text>
          </TouchableOpacity>
        </View>

        <Animated.View>
          {items.map((item) => (
            <FocusBlockCard key={item.id} item={item} onLaunch={onLaunch} />
          ))}
        </Animated.View>

        {focusCount < 3 && (
          <View style={styles.captureRow}>
            <TextInput
              style={styles.captureInput}
              value={capture}
              onChangeText={setCapture}
              placeholder="Add another focus item..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleAddCapture}
            />
            <TouchableOpacity
              style={[styles.addBtn, !capture.trim() && styles.addBtnDisabled]}
              onPress={handleAddCapture}
              disabled={!capture.trim()}
              activeOpacity={0.8}>
              <Plus size={18} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.helpPickBtn} onPress={startWizard} activeOpacity={0.85}>
          <Sparkles size={16} color={colors.accent} strokeWidth={2} />
          <Text style={styles.helpPickText}>Help Me Pick</Text>
        </TouchableOpacity>
      </ScrollView>

      <HelpMePickModal
        step={wizardStep}
        choices={wizardChoices}
        onClose={() => setWizardStep('closed')}
        onPickEnergy={pickEnergy}
        onPickChoice={pickChoice}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  unstuckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unstuckBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  captureRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  captureInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.35 },
  helpPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  helpPickText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
  },
});
