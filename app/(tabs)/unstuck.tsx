import React, { useRef, useState } from 'react';
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
import { Lightbulb, CheckCircle, Circle, Sparkles, RotateCcw } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';

type Phase = 'input' | 'loading' | 'steps';

/*
  Unstick Me Breakdown Engine
  ───────────────────────────
  RULES (hardcoded, no LLM override):
  1. Step 1 must ALWAYS be an incredibly low-stakes physical action
     (e.g. clear a space on your desk, put all papers in one pile, stand up).
     Never "open the doc" or "read a line" — those are cognitive, not physical.
  2. Step 2 must isolate a single logistical detail
     (e.g. find the one phone number, locate the one form, identify the one email).
  3. Step 3 must be a tiny verification check
     (e.g. does the form have all fields?, is the address correct?, does the email sound okay?).
  4. Never show more than one checkbox at a time — cognitive load stays at absolute zero.
  5. For paperwork/bureaucracy tasks, Step 1 must involve physical space clearing or gathering.
*/

const SIMULATED_BREAKDOWNS: Record<string, string[]> = {
  default: [
    'Clear a small space on your desk — just push everything to one side',
    'Find the one specific thing you need (a link, a name, a number) and put it front of you',
    'Check: do you have that one thing you need ready? Yes? You\'re set.',
  ],
  email: [
    'Put your phone face-down and close all other tabs — just a blank screen',
    'Find the one email you need to reply to and open only that',
    'Read just the first line of the original email — what are they actually asking?',
  ],
  cleaning: [
    'Stand up and walk to the messiest spot — don\'t touch anything yet, just stand there for 10 seconds',
    'Pick up exactly three items and put each one where it belongs',
    'Look at that spot — is it even slightly better? That\'s enough for now.',
  ],
  studying: [
    'Put your phone in another room or on silent across the room',
    'Open to the exact page or section — don\'t read yet, just have it open',
    'Read just the first sentence. That\'s all. One sentence.',
  ],
  work: [
    'Close every app and tab except the one you need — one screen, one thing',
    'Find the specific file, doc, or task and open only that',
    'Read just the title or first line — what is this actually about?',
  ],
  paperwork: [
    'Clear your desk surface — push everything off to one side so you have a blank workspace',
    'Gather ALL the papers/forms into one pile — don\'t sort, just stack',
    'Find the ONE form or document that has a deadline — put it on top',
  ],
  bureaucracy: [
    'Stand up and physically walk to wherever the documents live — don\'t bring them yet',
    'Bring just the ONE document you need most to your cleared workspace',
    'Find the single field or checkbox that matters first — don\'t fill it, just locate it',
  ],
  phone_call: [
    'Write the phone number on a sticky note and stick it to your screen — no searching mid-call',
    'Write down exactly one sentence you need to say ("I need to change my appointment")',
    'Check: do you have your account number or reference ready? That\'s all you need.',
  ],
};

function getBreakdown(text: string): string[] {
  const lower = text.toLowerCase();
  if (lower.includes('email') || lower.includes('message') || lower.includes('reply')) {
    return SIMULATED_BREAKDOWNS.email;
  }
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('mess') || lower.includes('dishes')) {
    return SIMULATED_BREAKDOWNS.cleaning;
  }
  if (lower.includes('study') || lower.includes('read') || lower.includes('homework') || lower.includes('class')) {
    return SIMULATED_BREAKDOWNS.studying;
  }
  if (lower.includes('paperwork') || lower.includes('form') || lower.includes('application') || lower.includes('document') || lower.includes('print') || lower.includes('fill out')) {
    return SIMULATED_BREAKDOWNS.paperwork;
  }
  if (lower.includes('bureau') || lower.includes('insurance') || lower.includes('tax') || lower.includes('permit') || lower.includes('license') || lower.includes('application') || lower.includes('submit')) {
    return SIMULATED_BREAKDOWNS.bureaucracy;
  }
  if (lower.includes('call') || lower.includes('phone') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('book')) {
    return SIMULATED_BREAKDOWNS.phone_call;
  }
  if (lower.includes('work') || lower.includes('project') || lower.includes('report') || lower.includes('meeting')) {
    return SIMULATED_BREAKDOWNS.work;
  }
  return SIMULATED_BREAKDOWNS.default;
}

export default function UnstuckScreen() {
  const [phase, setPhase] = useState<Phase>('input');
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  async function handleBreakdown() {
    if (!task.trim()) return;
    setPhase('loading');

    await new Promise((res) => setTimeout(res, 1800));

    const breakdown = getBreakdown(task);
    setSteps(breakdown);
    setCompletedSteps(new Array(breakdown.length).fill(false));
    setCurrentStep(0);

    try {
      await supabase.from('task_breakdowns').insert({
        original_task: task,
        micro_steps: breakdown,
        steps_completed: 0,
      });
    } catch (_) {}

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    setPhase('steps');
  }

  function completeStep(idx: number) {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    const updated = [...completedSteps];
    updated[idx] = true;
    setCompletedSteps(updated);

    setTimeout(() => {
      if (idx + 1 < steps.length) {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setCurrentStep(idx + 1);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      }
    }, 500);
  }

  function reset() {
    setPhase('input');
    setTask('');
    setSteps([]);
    setCurrentStep(0);
    setCompletedSteps([]);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
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
            <Text style={styles.title}>Unstuck Me</Text>
          </View>
          <Text style={styles.subtitle}>Break it into tiny, doable pieces</Text>
        </View>

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
              placeholder="e.g. I have to send that email but I keep avoiding it and I don't know where to start..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, !task.trim() && styles.primaryBtnDisabled]}
              onPress={handleBreakdown}
              activeOpacity={0.8}
              disabled={!task.trim()}>
              <Sparkles size={18} color={colors.black} strokeWidth={2} />
              <Text style={styles.primaryBtnText}>Break it down for me</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'loading' && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>🧠</Text>
            <Text style={styles.loadingTitle}>Working on it...</Text>
            <Text style={styles.loadingHint}>Finding just 3 tiny steps for you</Text>
          </View>
        )}

        {phase === 'steps' && !allDone && (
          <Animated.View style={[styles.stepsSection, { opacity: fadeAnim }]}>
            <View style={styles.taskContext}>
              <Text style={styles.taskContextLabel}>You said:</Text>
              <Text style={styles.taskContextText} numberOfLines={2}>{task}</Text>
            </View>

            <Text style={styles.stepsHeading}>
              Focus on just this one thing:
            </Text>

            <Animated.View style={[styles.bigCheckCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumBadgeText}>Step {currentStep + 1} of {steps.length}</Text>
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

            <Text style={styles.reassurance}>
              That's the only thing you need to do right now.
            </Text>
          </Animated.View>
        )}

        {phase === 'steps' && allDone && (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>You did all 3 steps.</Text>
            <Text style={styles.doneText}>
              That was the hardest part — getting started. Look at you.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.8}>
              <RotateCcw size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.resetBtnText}>Try a new task</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  card: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    lineHeight: 27,
  },
  cardHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
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
    minHeight: 120,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  loadingCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingEmoji: { fontSize: 40 },
  loadingTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  loadingHint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
  stepsSection: {
    padding: 16,
    gap: 16,
  },
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
  taskContextText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  stepsHeading: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  bigCheckCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.accent + '55',
    padding: 28,
    gap: 20,
    alignItems: 'center',
  },
  stepNumBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepNumBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
  },
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
  checkBtnText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  dotComplete: {
    backgroundColor: colors.success,
  },
  reassurance: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
});
