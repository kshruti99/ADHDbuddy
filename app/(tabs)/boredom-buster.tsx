import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle,
  Circle,
  Zap,
  Users,
  X,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import type { SideQuest } from '@/lib/supabase';

const TOTAL_SECONDS = 10 * 60;

const BODY_DOUBLE_MESSAGES = [
  "I'm right here with you. Let's just do 10 minutes.",
  'You started. That was the hardest part.',
  'No judgment — just presence. Keep going.',
  "One minute at a time. You've got this.",
  "I'm staying here until you're done. No rush.",
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type TimerState = 'idle' | 'running' | 'paused' | 'done';

export default function BoredomBusterScreen() {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [taskName, setTaskName] = useState('');
  const [bodyDoubleIdx, setBodyDoubleIdx] = useState(0);
  const [sideQuestInput, setSideQuestInput] = useState('');
  const [sideQuestModalVisible, setSideQuestModalVisible] = useState(false);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [sessionId] = useState(() => Date.now().toString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerState('done');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();

      return () => {
        clearInterval(intervalRef.current!);
        pulse.stop();
      };
    }
  }, [timerState]);

  useEffect(() => {
    const progress = secondsLeft / TOTAL_SECONDS;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [secondsLeft]);

  useEffect(() => {
    if (timerState !== 'running') return;
    const elapsed = TOTAL_SECONDS - secondsLeft;
    const newIdx = Math.floor(elapsed / 120) % BODY_DOUBLE_MESSAGES.length;
    setBodyDoubleIdx(newIdx);
  }, [secondsLeft, timerState]);

  function start() {
    setTimerState('running');
  }

  function pause() {
    clearInterval(intervalRef.current!);
    setTimerState('paused');
  }

  function resume() {
    setTimerState('running');
  }

  function reset() {
    clearInterval(intervalRef.current!);
    setTimerState('idle');
    setSecondsLeft(TOTAL_SECONDS);
    setBodyDoubleIdx(0);
    setSideQuests([]);
  }

  async function saveSideQuest() {
    if (!sideQuestInput.trim()) return;
    const newQuest: Omit<SideQuest, 'id' | 'created_at'> = {
      content: sideQuestInput.trim(),
      completed: false,
      session_id: sessionId,
    };
    setSideQuestInput('');
    setSideQuestModalVisible(false);

    try {
      const { data } = await supabase
        .from('side_quests')
        .insert({ ...newQuest })
        .select()
        .maybeSingle();
      if (data) {
        setSideQuests((prev) => [...prev, data as SideQuest]);
      } else {
        setSideQuests((prev) => [
          ...prev,
          { ...newQuest, id: Date.now().toString(), created_at: new Date().toISOString() },
        ]);
      }
    } catch (_) {
      setSideQuests((prev) => [
        ...prev,
        { ...newQuest, id: Date.now().toString(), created_at: new Date().toISOString() },
      ]);
    }
  }

  async function toggleSideQuest(id: string) {
    setSideQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q))
    );
    const quest = sideQuests.find((q) => q.id === id);
    if (!quest) return;
    try {
      await supabase
        .from('side_quests')
        .update({ completed: !quest.completed })
        .eq('id', id);
    } catch (_) {}
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.accentWarm, colors.accent, colors.success],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Timer size={22} color={colors.success} strokeWidth={2} />
            <Text style={styles.title}>Boredom Buster</Text>
          </View>
          <Text style={styles.subtitle}>10 minutes with a body double</Text>
        </View>

        {timerState === 'idle' && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>What's the task?</Text>
            <Text style={styles.setupHint}>
              Optional — name it so you know what to come back to.
            </Text>
            <TextInput
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="e.g. Reply to that email, tidy the desk..."
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.bodyDoubleNote}>
              <Users size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.bodyDoubleNoteText}>
                I'll be your body double — a silent presence to help you focus.
              </Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={start} activeOpacity={0.85}>
              <Play size={20} color={colors.black} strokeWidth={2.5} fill={colors.black} />
              <Text style={styles.startBtnText}>Start 10-Minute Focus</Text>
            </TouchableOpacity>
          </View>
        )}

        {(timerState === 'running' || timerState === 'paused') && (
          <View style={styles.activeSection}>
            <Animated.View style={[styles.timerRing, { transform: [{ scale: timerState === 'running' ? pulseAnim : 1 }] }]}>
              <Text style={styles.timerDisplay}>{formatTime(secondsLeft)}</Text>
              <Text style={styles.timerLabel}>
                {timerState === 'paused' ? 'Paused' : 'remaining'}
              </Text>
            </Animated.View>

            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth, backgroundColor: progressColor },
                ]}
              />
            </View>

            {taskName ? (
              <View style={styles.currentTaskBox}>
                <Text style={styles.currentTaskLabel}>Working on:</Text>
                <Text style={styles.currentTaskName}>{taskName}</Text>
              </View>
            ) : null}

            {timerState === 'running' && (
              <View style={styles.bodyDoubleCard}>
                <Users size={16} color={colors.primaryLight} strokeWidth={2} />
                <Text style={styles.bodyDoubleText}>{BODY_DOUBLE_MESSAGES[bodyDoubleIdx]}</Text>
              </View>
            )}

            <View style={styles.timerControls}>
              {timerState === 'running' ? (
                <TouchableOpacity style={styles.pauseBtn} onPress={pause} activeOpacity={0.8}>
                  <Pause size={20} color={colors.textPrimary} strokeWidth={2} />
                  <Text style={styles.pauseBtnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resumeBtn} onPress={resume} activeOpacity={0.8}>
                  <Play size={20} color={colors.black} strokeWidth={2} fill={colors.black} />
                  <Text style={styles.resumeBtnText}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.resetSmallBtn} onPress={reset} activeOpacity={0.8}>
                <RotateCcw size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sideQuestBtn}
              onPress={() => setSideQuestModalVisible(true)}
              activeOpacity={0.85}>
              <Zap size={18} color={colors.accent} strokeWidth={2.5} />
              <View style={styles.sideQuestBtnText}>
                <Text style={styles.sideQuestBtnTitle}>Got distracted?</Text>
                <Text style={styles.sideQuestBtnSub}>Save it as a Side Quest</Text>
              </View>
              <Plus size={18} color={colors.accent} strokeWidth={2.5} />
            </TouchableOpacity>

            {sideQuests.length > 0 && (
              <View style={styles.sideQuestsList}>
                <Text style={styles.sideQuestsHeader}>Side Quests saved for later:</Text>
                {sideQuests.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.sideQuestItem}
                    onPress={() => toggleSideQuest(q.id)}
                    activeOpacity={0.7}>
                    {q.completed ? (
                      <CheckCircle size={18} color={colors.success} strokeWidth={2} />
                    ) : (
                      <Circle size={18} color={colors.textMuted} strokeWidth={2} />
                    )}
                    <Text style={[styles.sideQuestText, q.completed && styles.sideQuestDone]}>
                      {q.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {timerState === 'done' && (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🌟</Text>
            <Text style={styles.doneTitle}>10 minutes done!</Text>
            <Text style={styles.doneText}>
              You showed up and kept going. That is not a small thing.
            </Text>
            {sideQuests.length > 0 && (
              <View style={styles.sideQuestsReview}>
                <Text style={styles.sideQuestsReviewTitle}>
                  Your side quests ({sideQuests.length}):
                </Text>
                {sideQuests.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.sideQuestItem}
                    onPress={() => toggleSideQuest(q.id)}
                    activeOpacity={0.7}>
                    {q.completed ? (
                      <CheckCircle size={18} color={colors.success} strokeWidth={2} />
                    ) : (
                      <Circle size={18} color={colors.textMuted} strokeWidth={2} />
                    )}
                    <Text style={[styles.sideQuestText, q.completed && styles.sideQuestDone]}>
                      {q.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.8}>
              <RotateCcw size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.resetBtnText}>Do another 10 minutes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={sideQuestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSideQuestModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSideQuestModalVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save a Side Quest</Text>
              <TouchableOpacity onPress={() => setSideQuestModalVisible(false)}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Capture the distraction so your brain can let go of it. You'll come back to it later.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={sideQuestInput}
              onChangeText={setSideQuestInput}
              placeholder="What grabbed your attention?"
              placeholderTextColor={colors.textMuted}
              autoFocus
              onSubmitEditing={saveSideQuest}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.saveBtn, !sideQuestInput.trim() && styles.saveBtnDisabled]}
              onPress={saveSideQuest}
              activeOpacity={0.8}
              disabled={!sideQuestInput.trim()}>
              <Text style={styles.saveBtnText}>Save & Return to Task</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  setupCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  setupHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  bodyDoubleNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  bodyDoubleNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  startBtn: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  activeSection: {
    padding: 16,
    gap: 16,
  },
  timerRing: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.success + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  timerDisplay: {
    fontSize: 56,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  currentTaskBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentTaskLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  currentTaskName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  bodyDoubleCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  bodyDoubleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  resetSmallBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideQuestBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    borderStyle: 'dashed',
  },
  sideQuestBtnText: { flex: 1 },
  sideQuestBtnTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
  },
  sideQuestBtnSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  sideQuestsList: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideQuestsHeader: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sideQuestItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sideQuestText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sideQuestDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  doneCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.successMuted,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  doneText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  sideQuestsReview: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sideQuestsReviewTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  modalHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalInput: {
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
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
});
