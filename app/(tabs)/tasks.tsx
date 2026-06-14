import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, MoveRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/lib/colors';
import { useMode } from '@/context/ModeContext';
import { useFocus } from '@/hooks/useFocus';
import { useBacklog } from '@/hooks/useBacklog';
import { useAnchors } from '@/hooks/useAnchors';
import { DayCalendar } from '@/components/DayCalendar';
import { FocusSection } from '@/components/FocusSection';
import { BacklogSection } from '@/components/BacklogSection';
import { HelpMePickModal } from '@/components/modals/HelpMePickModal';
import { AnchorEditorModal } from '@/components/modals/AnchorEditorModal';
import type { EnergyTag, WizardStep } from '@/lib/constants';
import type { AnchorItem, BacklogItem, FocusItem } from '@/lib/supabase';

type Segment = 'focus' | 'backlog';

export default function TasksScreen() {
  const { segment } = useLocalSearchParams<{ segment?: string }>();
  const { mode } = useMode();
  const focus = useFocus(mode);
  const backlog = useBacklog(mode);
  const anchors = useAnchors();

  const [activeSegment, setActiveSegment] = useState<Segment>('focus');
  const [focusInput, setFocusInput] = useState('');
  const [backlogInput, setBacklogInput] = useState('');
  const [backlogEnergy, setBacklogEnergy] = useState<EnergyTag>('quick_win');

  const [wizardStep, setWizardStep] = useState<WizardStep>('closed');
  const [wizardChoices, setWizardChoices] = useState<BacklogItem[]>([]);

  const [anchorModal, setAnchorModal] = useState(false);
  const [editingAnchor, setEditingAnchor] = useState<AnchorItem | null>(null);

  useEffect(() => {
    if (segment === 'focus' || segment === 'backlog') {
      setActiveSegment(segment);
    }
  }, [segment]);

  function startWizard() {
    setWizardStep('energy');
    setWizardChoices([]);
  }

  function pickEnergy(energy: EnergyTag) {
    const matches = backlog.incomplete.filter((b) => b.energy_tag === energy);
    const shuffled = [...matches].sort(() => Math.random() - 0.5);
    setWizardChoices(shuffled.slice(0, 2));
    setWizardStep('pick');
  }

  async function pickChoice(item: BacklogItem) {
    const promoted = await backlog.promoteToFocus(
      item,
      focus.active.length,
      (content) => focus.setOverflow(content)
    );
    if (promoted) await focus.reload();
    setWizardStep('closed');
  }

  async function handleMoveOverflow(content: string) {
    await backlog.add(content);
    focus.setOverflow(null);
  }

  async function handleFocusLater(item: FocusItem) {
    const content = item.content;
    await focus.removeFromToday(item);
    await backlog.add(content);
  }

  const loading = focus.loading || backlog.loading || anchors.loading;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Tasks</Text>
          </View>

          <DayCalendar
            anchors={anchors.anchors}
            onAdd={() => {
              setEditingAnchor(null);
              setAnchorModal(true);
            }}
            onEdit={(anchor) => {
              setEditingAnchor(anchor);
              setAnchorModal(true);
            }}
          />

          <View style={styles.segmented}>
            {(['focus', 'backlog'] as Segment[]).map((seg) => (
              <TouchableOpacity
                key={seg}
                style={[styles.segment, activeSegment === seg && styles.segmentActive]}
                onPress={() => setActiveSegment(seg)}
                activeOpacity={0.8}>
                <Text style={[styles.segmentText, activeSegment === seg && styles.segmentTextActive]}>
                  {seg === 'focus' ? 'Focus' : 'Backlog'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {focus.overflow && (
            <View style={styles.overflow}>
              <View style={styles.overflowHeader}>
                <AlertTriangle size={16} color={colors.accent} strokeWidth={2} />
                <Text style={styles.overflowTitle}>Your current focus is full!</Text>
              </View>
              <Text style={styles.overflowBody}>
                Save &quot;{focus.overflow}&quot; to your Brain Backlog instead?
              </Text>
              <View style={styles.overflowActions}>
                <TouchableOpacity
                  style={styles.overflowYes}
                  onPress={() => handleMoveOverflow(focus.overflow!)}
                  activeOpacity={0.8}>
                  <MoveRight size={14} color={colors.black} strokeWidth={2.5} />
                  <Text style={styles.overflowYesText}>Yes, move to Backlog</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => focus.setOverflow(null)} style={styles.overflowNo}>
                  <Text style={styles.overflowNoText}>No thanks</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeSegment === 'focus' ? (
            <FocusSection
              active={focus.active}
              completed={focus.completed}
              input={focusInput}
              onInputChange={setFocusInput}
              onAdd={async () => {
                const ok = await focus.add(focusInput);
                if (ok) setFocusInput('');
              }}
              onToggle={focus.toggle}
              onDone={focus.markDone}
              onLater={handleFocusLater}
              onHelpMePick={startWizard}
              showHelpMePick={backlog.incomplete.length > 0}
              overflow={null}
              onMoveOverflowToBacklog={handleMoveOverflow}
              onDismissOverflow={() => focus.setOverflow(null)}
            />
          ) : (
            <BacklogSection
              items={backlog.incomplete}
              input={backlogInput}
              energy={backlogEnergy}
              onInputChange={setBacklogInput}
              onEnergyChange={setBacklogEnergy}
              onAdd={async () => {
                await backlog.add(backlogInput, backlogEnergy);
                setBacklogInput('');
              }}
              onToggle={backlog.toggle}
              onDone={backlog.markDone}
              onLater={backlog.deprioritize}
              onPromote={async (item) => {
                const promoted = await backlog.promoteToFocus(
                  item,
                  focus.active.length,
                  (content) => focus.setOverflow(content)
                );
                if (promoted) await focus.reload();
              }}
              onHelpMePick={startWizard}
            />
          )}

          {(focus.completed.length > 0 || backlog.completed.length > 0) && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={async () => {
                await Promise.all([focus.clearFinished(), backlog.clearFinished()]);
              }}
              activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Clear finished</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      <HelpMePickModal
        step={wizardStep}
        choices={wizardChoices}
        onClose={() => setWizardStep('closed')}
        onPickEnergy={pickEnergy}
        onPickChoice={pickChoice}
      />

      <AnchorEditorModal
        visible={anchorModal}
        editing={editingAnchor}
        onClose={() => setAnchorModal(false)}
        onSave={(title, time, commute, prep) => anchors.save(title, time, commute, prep, editingAnchor)}
        onRemove={
          editingAnchor
            ? async () => {
                await anchors.removeFromToday(editingAnchor);
                setAnchorModal(false);
              }
            : undefined
        }
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  pageHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  pageTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: colors.primaryMuted },
  segmentText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  segmentTextActive: { color: colors.primaryLight, fontFamily: 'Inter_700Bold' },
  clearBtn: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  overflow: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    padding: 18,
    gap: 10,
  },
  overflowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overflowTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent },
  overflowBody: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  overflowActions: { flexDirection: 'row', gap: 10 },
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
