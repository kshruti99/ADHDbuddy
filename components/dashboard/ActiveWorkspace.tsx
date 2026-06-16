import React from 'react';
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
import {
  CheckCircle,
  Circle,
  Pause,
  Play,
  RotateCcw,
  Users,
  X,
  Zap,
  Plus,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import {
  BODY_DOUBLE_MESSAGES,
  formatTime,
  useTimerEngine,
} from '@/hooks/useTimerEngine';
import type { FocusItem } from '@/lib/supabase';

interface Props {
  item: FocusItem;
  onComplete: (item: FocusItem) => void;
  onAbandon: () => void;
}

export function ActiveWorkspace({ item, onComplete, onAbandon }: Props) {
  const sessionId = React.useRef(Date.now().toString()).current;
  const timer = useTimerEngine(sessionId, () => onComplete(item));

  return (
    <View style={styles.root}>
      {/* Top accent banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>WORKING ON</Text>
        <Text style={styles.bannerTask} numberOfLines={2}>
          {item.content}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Timer ring */}
        <Animated.View
          style={[
            styles.timerRing,
            { transform: [{ scale: timer.timerState === 'running' ? timer.pulseAnim : 1 }] },
          ]}>
          <Text style={styles.timerDisplay}>{formatTime(timer.secondsLeft)}</Text>
          <Text style={styles.timerLabel}>
            {timer.timerState === 'idle'
              ? 'ready'
              : timer.timerState === 'paused'
              ? 'paused'
              : 'remaining'}
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: timer.progressWidth, backgroundColor: timer.progressColor },
            ]}
          />
        </View>

        {/* Body double */}
        {timer.timerState === 'running' && (
          <View style={styles.bodyDoubleCard}>
            <Users size={16} color={colors.primaryLight} strokeWidth={2} />
            <Text style={styles.bodyDoubleText}>
              {BODY_DOUBLE_MESSAGES[timer.bodyDoubleIdx]}
            </Text>
          </View>
        )}

        {timer.timerState === 'idle' && (
          <View style={styles.bodyDoubleCard}>
            <Users size={16} color={colors.primary} strokeWidth={2} />
            <Text style={styles.bodyDoubleText}>
              Body double is active with you.
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {timer.timerState === 'idle' && (
            <TouchableOpacity style={styles.startBtn} onPress={timer.start} activeOpacity={0.85}>
              <Play size={20} color="#000" strokeWidth={2.5} fill="#000" />
              <Text style={styles.startBtnText}>Start 10-Minute Focus</Text>
            </TouchableOpacity>
          )}

          {timer.timerState === 'running' && (
            <>
              <TouchableOpacity style={styles.pauseBtn} onPress={timer.pause} activeOpacity={0.8}>
                <Pause size={20} color={colors.textPrimary} strokeWidth={2} />
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetSmall} onPress={timer.reset} activeOpacity={0.8}>
                <RotateCcw size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {timer.timerState === 'paused' && (
            <>
              <TouchableOpacity style={styles.resumeBtn} onPress={timer.resume} activeOpacity={0.85}>
                <Play size={20} color="#000" strokeWidth={2} fill="#000" />
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetSmall} onPress={timer.reset} activeOpacity={0.8}>
                <RotateCcw size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {timer.timerState === 'done' && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => onComplete(item)}
              activeOpacity={0.85}>
              <CheckCircle size={20} color="#000" strokeWidth={2} />
              <Text style={styles.completeBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Manual complete when running/paused */}
        {(timer.timerState === 'running' || timer.timerState === 'paused') && (
          <TouchableOpacity
            style={styles.earlyCompleteBtn}
            onPress={() => onComplete(item)}
            activeOpacity={0.8}>
            <CheckCircle size={16} color={colors.success} strokeWidth={2} />
            <Text style={styles.earlyCompleteBtnText}>Done early</Text>
          </TouchableOpacity>
        )}

        {/* Side quest capture */}
        {(timer.timerState === 'running' || timer.timerState === 'paused') && (
          <TouchableOpacity
            style={styles.sideQuestBtn}
            onPress={() => timer.setSideQuestModalVisible(true)}
            activeOpacity={0.85}>
            <Zap size={18} color={colors.accent} strokeWidth={2.5} />
            <View style={styles.sideQuestBtnTextBlock}>
              <Text style={styles.sideQuestBtnTitle}>Mind Drift? Tap to park a Side Quest</Text>
              <Text style={styles.sideQuestBtnSub}>Capture it, then return to your task.</Text>
            </View>
            <Plus size={18} color={colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {timer.sideQuests.length > 0 && (
          <View style={styles.sideQuestsList}>
            <Text style={styles.sideQuestsHeader}>Parked side quests:</Text>
            {timer.sideQuests.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={styles.sideQuestItem}
                onPress={() => timer.toggleSideQuest(q.id)}
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

        {/* Abandon link */}
        <TouchableOpacity style={styles.abandonBtn} onPress={onAbandon} activeOpacity={0.7}>
          <Text style={styles.abandonText}>← Back to focus board</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Side quest modal */}
      <Modal
        visible={timer.sideQuestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => timer.setSideQuestModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => timer.setSideQuestModalVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Park a Side Quest</Text>
              <TouchableOpacity onPress={() => timer.setSideQuestModalVisible(false)}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Capture it so your brain can let go. You'll return to it later.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={timer.sideQuestInput}
              onChangeText={timer.setSideQuestInput}
              placeholder="What grabbed your attention?"
              placeholderTextColor={colors.textMuted}
              autoFocus
              onSubmitEditing={timer.saveSideQuest}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.saveBtn, !timer.sideQuestInput.trim() && styles.saveBtnDisabled]}
              onPress={timer.saveSideQuest}
              activeOpacity={0.8}
              disabled={!timer.sideQuestInput.trim()}>
              <Text style={styles.saveBtnText}>Save & Return to Task</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 2,
  },
  bannerLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  bannerTask: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 22,
  },
  scroll: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
    alignItems: 'stretch',
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
  progressBarFill: { height: 6, borderRadius: 3 },
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
  controls: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  startBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#000' },
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
  pauseBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
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
  resumeBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000' },
  resetSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  completeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#000' },
  earlyCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  earlyCompleteBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.success,
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
  sideQuestBtnTextBlock: { flex: 1 },
  sideQuestBtnTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent },
  sideQuestBtnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginTop: 2 },
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
  sideQuestItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sideQuestText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sideQuestDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  abandonBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  abandonText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
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
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
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
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000' },
});
