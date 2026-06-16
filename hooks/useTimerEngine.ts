import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import type { SideQuest } from '@/lib/supabase';

export const TOTAL_SECONDS = 10 * 60;

export const BODY_DOUBLE_MESSAGES = [
  "I'm right here with you. Let's just do 10 minutes.",
  'You started. That was the hardest part.',
  'No judgment — just presence. Keep going.',
  "One minute at a time. You've got this.",
  "I'm staying here until you're done. No rush.",
];

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function useTimerEngine(sessionId: string, onTimerDone?: () => void) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [bodyDoubleIdx, setBodyDoubleIdx] = useState(0);
  const [sideQuestInput, setSideQuestInput] = useState('');
  const [sideQuestModalVisible, setSideQuestModalVisible] = useState(false);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);

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
            onTimerDone?.();
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
  }, [timerState, onTimerDone, pulseAnim]);

  useEffect(() => {
    const progress = secondsLeft / TOTAL_SECONDS;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [secondsLeft, progressAnim]);

  useEffect(() => {
    if (timerState !== 'running') return;
    const elapsed = TOTAL_SECONDS - secondsLeft;
    setBodyDoubleIdx(Math.floor(elapsed / 120) % BODY_DOUBLE_MESSAGES.length);
  }, [secondsLeft, timerState]);

  function start() { setTimerState('running'); }

  function pause() {
    clearInterval(intervalRef.current!);
    setTimerState('paused');
  }

  function resume() { setTimerState('running'); }

  function reset() {
    clearInterval(intervalRef.current!);
    setTimerState('idle');
    setSecondsLeft(TOTAL_SECONDS);
    setBodyDoubleIdx(0);
    setSideQuests([]);
  }

  function saveSideQuest() {
    if (!sideQuestInput.trim()) return;
    const newQuest: SideQuest = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      content: sideQuestInput.trim(),
      completed: false,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    };
    setSideQuestInput('');
    setSideQuestModalVisible(false);
    setSideQuests((prev) => [...prev, newQuest]);
  }

  function toggleSideQuest(id: string) {
    setSideQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q))
    );
  }

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['#FF7B54', '#F6A623', '#4ECDC4'],
  });

  return {
    timerState,
    secondsLeft,
    bodyDoubleIdx,
    sideQuestInput,
    setSideQuestInput,
    sideQuestModalVisible,
    setSideQuestModalVisible,
    sideQuests,
    pulseAnim,
    progressWidth,
    progressColor,
    start,
    pause,
    resume,
    reset,
    saveSideQuest,
    toggleSideQuest,
  };
}
