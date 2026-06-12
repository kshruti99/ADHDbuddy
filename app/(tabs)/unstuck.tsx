import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Lightbulb, RotateCcw } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { useMode } from '@/context/ModeContext';
import { useFocus } from '@/hooks/useFocus';
import { useBacklog } from '@/hooks/useBacklog';
import { useAnchors } from '@/hooks/useAnchors';
import { useNow } from '@/hooks/useNow';
import {
  buildEasierStep1,
  buildSteps,
  detectCategory,
  detectClarify,
} from '@/lib/unstickEngine';
import { buildPlanBlocks, buildAnchorTimestamps, formatTimeShort } from '@/lib/time';
import { PlanTimeline } from '@/components/PlanTimeline';

type MainTab = 'unstick' | 'plan';
type UnstickPhase = 'input' | 'clarify' | 'steps' | 'done';
type PlanPhase = 'input' | 'details' | 'timeline';

const PREP_OPTIONS = [5, 10, 15, 30];
const COMMUTE_OPTIONS = [0, 5, 15, 30];

export default function UnstuckScreen() {
  const { tab, task: taskParam } = useLocalSearchParams<{ tab?: string; task?: string }>();
  const router = useRouter();
  const { mode } = useMode();
  const focus = useFocus(mode);
  const backlog = useBacklog(mode);
  const anchors = useAnchors();
  const now = useNow();

  const [mainTab, setMainTab] = useState<MainTab>('unstick');

  // Unstick state
  const [phase, setPhase] = useState<UnstickPhase>('input');
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [clarifyValue, setClarifyValue] = useState<string | undefined>();
  const [clarifyQuestion, setClarifyQuestion] = useState<ReturnType<typeof detectClarify>>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [skipCount, setSkipCount] = useState(0);
  const [breakdownId, setBreakdownId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Plan state
  const [planPhase, setPlanPhase] = useState<PlanPhase>('input');
  const [planTask, setPlanTask] = useState('');
  const [planHour, setPlanHour] = useState('3');
  const [planMinute, setPlanMinute] = useState('00');
  const [planMeridiem, setPlanMeridiem] = useState<'AM' | 'PM'>('PM');
  const [prepMin, setPrepMin] = useState(10);
  const [commuteMin, setCommuteMin] = useState(15);
  const [planBlocks, setPlanBlocks] = useState<ReturnType<typeof buildPlanBlocks>>([]);

  useEffect(() => {
    if (tab === 'plan') setMainTab('plan');
    if (tab === 'unstick') setMainTab('unstick');
    if (taskParam) {
      setTask(taskParam);
      setPlanTask(taskParam);
    }
  }, [tab, taskParam]);

  function startBreakdown() {
    if (!task.trim()) return;
    const clarify = detectClarify(task);
    if (clarify) {
      setClarifyQuestion(clarify);
      setPhase('clarify');
      return;
    }
    goToSteps(task);
  }

  async function goToSteps(taskText: string, clarify?: string) {
    if (clarify === 'plan') {
      setMainTab('plan');
      setPlanTask(taskText);
      setPlanPhase('input');
      setPhase('input');
      return;
    }
    const cat = detectCategory(taskText, clarify);
    setClarifyValue(clarify);
    const built = buildSteps(taskText, cat, clarify);
    setSteps(built);
    setCompletedSteps(new Array(built.length).fill(false));
    setCurrentStep(0);
    setSkipCount(0);
    setPhase('steps');

    const { data } = await supabase
      .from('task_breakdowns')
      .insert({ original_task: taskText, micro_steps: built, steps_completed: 0 })
      .select()
      .maybeSingle();
    if (data) setBreakdownId(data.id);
  }

  function handleClarify(value: string) {
    if (value === 'plan') {
      setMainTab('plan');
      setPlanTask(task);
      setPlanPhase('details');
      setPhase('input');
      return;
    }
    goToSteps(task, value);
  }

  async function completeStep(idx: number) {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    const updated = [...completedSteps];
    updated[idx] = true;
    setCompletedSteps(updated);

    if (breakdownId) {
      await supabase
        .from('task_breakdowns')
        .update({ steps_completed: idx + 1 })
        .eq('id', breakdownId);
    }

    setTimeout(() => {
      if (idx + 1 < steps.length) {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setCurrentStep(idx + 1);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      } else {
        setPhase('done');
      }
    }, 400);
  }

  function skipStep() {
    const easier = buildEasierStep1();
    const newSteps = [...steps];
    newSteps[currentStep] = easier;
    setSteps(newSteps);
    setSkipCount((c) => c + 1);
  }

  function resetUnstick() {
    setPhase('input');
    setTask('');
    setSteps([]);
    setCurrentStep(0);
    setCompletedSteps([]);
    setSkipCount(0);
    setBreakdownId(null);
    setClarifyQuestion(null);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }

  function buildPlan() {
    const timeText = `${planHour}:${planMinute} ${planMeridiem}`;
    const timestamps = buildAnchorTimestamps(timeText, commuteMin, prepMin);
    if (!timestamps) return;
    const eventTime = new Date(timestamps.anchor_at);
    const blocks = buildPlanBlocks(planTask.trim() || 'Event', eventTime, prepMin, commuteMin);
    setPlanBlocks(blocks);
    setPlanPhase('timeline');
  }

  async function savePlanToCalendar() {
    const timeText = `${planHour}:${planMinute} ${planMeridiem}`;
    await anchors.save(planTask.trim() || 'Event', timeText, commuteMin, prepMin);
    const timestamps = buildAnchorTimestamps(timeText, commuteMin, prepMin);
    if (timestamps) {
      await supabase.from('adhd_schedules').insert({
        deadline_label: planTask.trim() || 'Event',
        deadline_at: timestamps.anchor_at,
        steps: planBlocks.map((b) => ({
          label: b.label,
          time: b.time.toISOString(),
          coaching: b.coaching,
        })),
      });
    }
    router.push('/tasks');
  }

  async function addToFocus() {
    await focus.add(task);
    router.push({ pathname: '/tasks', params: { segment: 'focus' } });
  }

  async function addToBacklog() {
    await backlog.add(task);
    router.push({ pathname: '/tasks', params: { segment: 'backlog' } });
  }

  const allDone = completedSteps.length > 0 && completedSteps.every(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Lightbulb size={22} color={colors.accent} strokeWidth={2} />
            <Text style={styles.title}>Unstuck</Text>
          </View>
          <Text style={styles.subtitle}>Break it down or plan backward from a deadline</Text>
        </View>

        <View style={styles.mainTabs}>
          {(['unstick', 'plan'] as MainTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.mainTab, mainTab === t && styles.mainTabActive]}
              onPress={() => setMainTab(t)}
              activeOpacity={0.8}>
              <Text style={[styles.mainTabText, mainTab === t && styles.mainTabTextActive]}>
                {t === 'unstick' ? 'Unstick' : 'Plan it'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mainTab === 'unstick' && (
          <>
            {phase === 'input' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>What has you frozen right now?</Text>
                <Text style={styles.cardHint}>
                  Don't filter yourself — just describe what feels overwhelming.
                </Text>
                <TextInput
                  style={styles.textarea}
                  value={task}
                  onChangeText={setTask}
                  placeholder="e.g. I have to send that email but I keep avoiding it..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, !task.trim() && styles.primaryBtnDisabled]}
                  onPress={startBreakdown}
                  activeOpacity={0.8}
                  disabled={!task.trim()}>
                  <Text style={styles.primaryBtnText}>Break it down</Text>
                </TouchableOpacity>
              </View>
            )}

            {phase === 'clarify' && clarifyQuestion && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{clarifyQuestion.question}</Text>
                {clarifyQuestion.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.clarifyBtn}
                    onPress={() => handleClarify(opt.value)}
                    activeOpacity={0.8}>
                    <Text style={styles.clarifyText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {phase === 'steps' && !allDone && (
              <Animated.View style={[styles.stepsSection, { opacity: fadeAnim }]}>
                <View style={styles.taskContext}>
                  <Text style={styles.taskContextLabel}>You said:</Text>
                  <Text style={styles.taskContextText} numberOfLines={2}>{task}</Text>
                </View>

                <Text style={styles.stepsHeading}>Focus on just this one thing:</Text>

                <Animated.View style={[styles.bigCheckCard, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={styles.stepNumBadge}>
                    <Text style={styles.stepNumBadgeText}>
                      Step {currentStep + 1} of {steps.length}
                    </Text>
                  </View>
                  <Text style={styles.bigStepText}>{steps[currentStep]}</Text>
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => completeStep(currentStep)}
                    activeOpacity={0.85}>
                    <CheckCircle size={28} color={colors.white} strokeWidth={2} />
                    <Text style={styles.checkBtnText}>I did it</Text>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity style={styles.skipBtn} onPress={skipStep} activeOpacity={0.7}>
                  <Text style={styles.skipText}>Skip — show me something easier</Text>
                </TouchableOpacity>

                {skipCount >= 2 && (
                  <View style={styles.stuckCard}>
                    <Text style={styles.stuckTitle}>Still stuck?</Text>
                    <TouchableOpacity onPress={() => addToBacklog()} style={styles.stuckAction}>
                      <Text style={styles.stuckActionText}>Save to backlog for later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setMainTab('plan');
                        setPlanTask(task);
                        setPlanPhase('details');
                      }}
                      style={styles.stuckAction}>
                      <Text style={styles.stuckActionText}>Try planning it instead</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.progressDots}>
                  {steps.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < currentStep && styles.dotComplete,
                        i === currentStep && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {phase === 'done' && (
              <View style={styles.doneCard}>
                <Text style={styles.doneEmoji}>🎉</Text>
                <Text style={styles.doneTitle}>You did all 3 steps.</Text>
                <Text style={styles.doneText}>That was the hardest part — getting started.</Text>
                <View style={styles.doneActions}>
                  <TouchableOpacity style={styles.doneActionBtn} onPress={addToFocus} activeOpacity={0.8}>
                    <Text style={styles.doneActionText}>Add to today's focus</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneActionBtn} onPress={addToBacklog} activeOpacity={0.8}>
                    <Text style={styles.doneActionText}>Save to backlog</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.doneActionBtn}
                    onPress={() => {
                      setMainTab('plan');
                      setPlanTask(task);
                      setPlanPhase('details');
                    }}
                    activeOpacity={0.8}>
                    <Text style={styles.doneActionText}>Plan the rest</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetBtn} onPress={resetUnstick} activeOpacity={0.8}>
                    <RotateCcw size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.resetBtnText}>Done for now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {mainTab === 'plan' && (
          <>
            {planPhase === 'input' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>What's the thing with a deadline?</Text>
                <TextInput
                  style={styles.textarea}
                  value={planTask}
                  onChangeText={setPlanTask}
                  placeholder="e.g. Doctor appointment, turn in essay..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, !planTask.trim() && styles.primaryBtnDisabled]}
                  onPress={() => setPlanPhase('details')}
                  disabled={!planTask.trim()}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {planPhase === 'details' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>When is it?</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.timeInput, { flex: 1 }]}
                    value={planHour}
                    onChangeText={setPlanHour}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.colon}>:</Text>
                  <TextInput
                    style={[styles.timeInput, { flex: 1 }]}
                    value={planMinute}
                    onChangeText={setPlanMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <View style={styles.meridiemRow}>
                    {(['AM', 'PM'] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.meridiemBtn, planMeridiem === m && styles.meridiemActive]}
                        onPress={() => setPlanMeridiem(m)}>
                        <Text style={[styles.meridiemText, planMeridiem === m && styles.meridiemTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Prep time (minutes)</Text>
                <View style={styles.optionRow}>
                  {PREP_OPTIONS.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.optionChip, prepMin === v && styles.optionChipActive]}
                      onPress={() => setPrepMin(v)}>
                      <Text style={[styles.optionText, prepMin === v && styles.optionTextActive]}>{v}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Commute / travel (minutes)</Text>
                <View style={styles.optionRow}>
                  {COMMUTE_OPTIONS.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.optionChip, commuteMin === v && styles.optionChipActive]}
                      onPress={() => setCommuteMin(v)}>
                      <Text style={[styles.optionText, commuteMin === v && styles.optionTextActive]}>
                        {v === 0 ? 'None' : `${v}m`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={buildPlan} activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>Show me the timeline</Text>
                </TouchableOpacity>
              </View>
            )}

            {planPhase === 'timeline' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{planTask}</Text>
                <Text style={styles.planDeadline}>
                  Event at {formatTimeShort(new Date(buildAnchorTimestamps(`${planHour}:${planMinute} ${planMeridiem}`, commuteMin, prepMin)!.anchor_at))}
                </Text>
                <PlanTimeline blocks={planBlocks} now={now} />
                <TouchableOpacity style={styles.primaryBtn} onPress={savePlanToCalendar} activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>Add to calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setMainTab('unstick');
                    setTask(planTask);
                    goToSteps(planTask);
                  }}
                  activeOpacity={0.8}>
                  <Text style={styles.secondaryBtnText}>Break it down too</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  mainTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  mainTabActive: { backgroundColor: colors.primaryMuted },
  mainTabText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  mainTabTextActive: { color: colors.primaryLight, fontFamily: 'Inter_700Bold' },
  card: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  cardTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', color: colors.textPrimary, lineHeight: 27 },
  cardHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  textarea: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.black },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  clarifyBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  clarifyText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  stepsSection: { padding: 16, gap: 16 },
  taskContext: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  taskContextLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  taskContextText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 19 },
  stepsHeading: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textSecondary, paddingHorizontal: 4 },
  bigCheckCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.accent + '55',
    padding: 28,
    gap: 20,
    alignItems: 'center',
  },
  stepNumBadge: { backgroundColor: colors.accentMuted, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  stepNumBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.accent },
  bigStepText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  checkBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBtnText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.black },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  stuckCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stuckTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  stuckAction: { paddingVertical: 8 },
  stuckActionText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.primaryLight },
  progressDots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 24 },
  dotComplete: { backgroundColor: colors.success },
  doneCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.successMuted,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  doneText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 23 },
  doneActions: { width: '100%', gap: 8, marginTop: 8 },
  doneActionBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  resetBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  colon: { fontSize: 20, color: colors.textMuted },
  meridiemRow: { flexDirection: 'row', gap: 4 },
  meridiemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  meridiemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  meridiemText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  meridiemTextActive: { color: colors.primaryLight },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  optionChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  optionText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  optionTextActive: { color: colors.primaryLight },
  planDeadline: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
});
