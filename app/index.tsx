import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CalendarDays } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useMode } from '@/context/ModeContext';
import { useFocus } from '@/hooks/useFocus';
import { useBacklog } from '@/hooks/useBacklog';
import { useDailyReset } from '@/hooks/useDailyReset';
import { CleanSlateEntry } from '@/components/dashboard/CleanSlateEntry';
import { FocusBoard } from '@/components/dashboard/FocusBoard';
import { ActiveWorkspace } from '@/components/dashboard/ActiveWorkspace';
import { PoofReward } from '@/components/dashboard/PoofReward';
import { BacklogSheet } from '@/components/dashboard/BacklogSheet';
import { CalendarSheet } from '@/components/dashboard/CalendarSheet';
import type { FocusItem } from '@/lib/supabase';

type DashView = 'entry' | 'board' | 'workspace';

export default function DashboardScreen() {
  const router = useRouter();
  const { mode, setMode } = useMode();
  const focus = useFocus(mode);
  const backlog = useBacklog(mode);

  const [view, setView] = useState<DashView>('entry');
  const [activeItem, setActiveItem] = useState<FocusItem | null>(null);
  const [poofItem, setPoofItem] = useState<FocusItem | null>(null);
  const [backlogSheetOpen, setBacklogSheetOpen] = useState(false);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);

  // Run Midnight Purge on mount / foreground; if purge ran, force entry view
  const handlePurgeComplete = useCallback(() => {
    setView('entry');
  }, []);
  useDailyReset(mode, handlePurgeComplete);

  // Derive view from focus state (after purge settles)
  useEffect(() => {
    if (focus.loading) return;
    if (view === 'workspace') return; // don't interrupt active session
    if (focus.active.length === 0) {
      setView('entry');
    } else if (view === 'entry') {
      setView('board');
    }
  }, [focus.loading, focus.active.length]);

  async function handleSubmitFocus(text: string) {
    const added = await focus.add(text);
    if (added) setView('board');
  }

  function handleLaunch(item: FocusItem) {
    setActiveItem(item);
    setView('workspace');
  }

  async function handleComplete(item: FocusItem) {
    setPoofItem(item);
    setView('board');
    await focus.complete(item);
  }

  function handlePoofDone() {
    setPoofItem(null);
  }

  function handleAbandon() {
    setActiveItem(null);
    setView(focus.active.length > 0 ? 'board' : 'entry');
  }

  function handleOpenUnstuck() {
    router.push('/unstuck');
  }

  if (focus.loading || backlog.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading your space...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header bar (hidden during active workspace — banner replaces it) */}
      {view !== 'workspace' && (
        <View style={styles.topBar}>
          <Text style={styles.appName}>ADHDbuddy</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setCalendarSheetOpen(true)}
            activeOpacity={0.8}>
            <CalendarDays size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {view === 'entry' && (
        <CleanSlateEntry
          mode={mode}
          onModeChange={setMode}
          backlogCount={backlog.incomplete.length}
          onSubmitFocus={handleSubmitFocus}
          onViewBacklog={() => setBacklogSheetOpen(true)}
        />
      )}

      {view === 'board' && (
        <FocusBoard
          items={focus.active}
          backlogIncomplete={backlog.incomplete}
          focusCount={focus.active.length}
          onLaunch={handleLaunch}
          onAddFocus={handleSubmitFocus}
          onSetOverflow={(content) => focus.setOverflow(content)}
          onPromoteToFocus={backlog.promoteToFocus}
          onReloadFocus={focus.reload}
          onOpenUnstuck={handleOpenUnstuck}
        />
      )}

      {view === 'workspace' && activeItem && (
        <ActiveWorkspace
          item={activeItem}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
        />
      )}

      {/* Poof overlay — renders above everything */}
      {poofItem && (
        <PoofReward taskName={poofItem.content} onDone={handlePoofDone} />
      )}

      {/* Sheets */}
      <BacklogSheet
        visible={backlogSheetOpen}
        onClose={() => setBacklogSheetOpen(false)}
        backlogItems={backlog.incomplete}
        focusItems={focus.active}
        onAddBacklog={backlog.add}
        onPromoteToFocus={backlog.promoteToFocus}
        onSetOverflow={(content) => focus.setOverflow(content)}
        onReloadFocus={focus.reload}
      />

      <CalendarSheet
        visible={calendarSheetOpen}
        onClose={() => setCalendarSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  iconBtn: {
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
