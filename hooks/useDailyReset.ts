import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage';
import { localDayKey, startOfTodayISO } from '@/lib/dayBoundary';
import type { FocusItem, BacklogItem } from '@/lib/supabase';
import type { Mode } from '@/lib/constants';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Midnight Purge — runs on first mount each day and on app foreground.
 *
 * - Incomplete current_focus items older than today → moved to brain_backlog vault.
 * - Completed current_focus items older than today → removed (already in task_history).
 * - Everything lives in AsyncStorage (localStorage on web) — no server calls.
 */
export function useDailyReset(mode: Mode, onComplete?: () => void) {
  const [purged, setPurged] = useState(false);
  const [running, setRunning] = useState(false);
  const ranThisSession = useRef(false);

  const runPurge = useCallback(async () => {
    if (ranThisSession.current) return;
    ranThisSession.current = true;
    setRunning(true);

    try {
      const today = localDayKey();
      const lastActive = await storageGet<string | null>(STORAGE_KEYS.LAST_ACTIVE_DATE, null);

      if (lastActive === today) {
        setRunning(false);
        return;
      }

      const cutoff = startOfTodayISO();

      // Read all focus items (all modes)
      const allFocus = await storageGet<FocusItem[]>(STORAGE_KEYS.FOCUS, []);
      const staleIncomplete = allFocus.filter(
        (f) => f.mode === mode && !f.completed && f.created_at < cutoff
      );
      const staleCompleted = allFocus.filter(
        (f) => f.mode === mode && f.completed && f.created_at < cutoff
      );
      const staleIds = new Set([
        ...staleIncomplete.map((f) => f.id),
        ...staleCompleted.map((f) => f.id),
      ]);

      if (staleIds.size > 0) {
        // Remove stale items from focus
        const cleanedFocus = allFocus.filter((f) => !staleIds.has(f.id));
        await storageSet(STORAGE_KEYS.FOCUS, cleanedFocus);

        // Move incomplete items to backlog vault
        if (staleIncomplete.length > 0) {
          const allBacklog = await storageGet<BacklogItem[]>(STORAGE_KEYS.BACKLOG, []);
          const backlogEntries: BacklogItem[] = staleIncomplete.map((f) => ({
            id: makeId(),
            content: f.content,
            mode: f.mode,
            energy_tag: 'quick_win' as const,
            completed: false,
            created_at: new Date().toISOString(),
          }));
          await storageSet(STORAGE_KEYS.BACKLOG, [...allBacklog, ...backlogEntries]);
        }
      }

      await storageSet(STORAGE_KEYS.LAST_ACTIVE_DATE, today);
      setPurged(true);
      onComplete?.();
    } catch (err) {
      console.error('useDailyReset error:', err);
    } finally {
      setRunning(false);
    }
  }, [mode, onComplete]);

  useEffect(() => {
    runPurge();
  }, [runPurge]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ranThisSession.current = false;
        runPurge();
      }
    });
    return () => sub.remove();
  }, [runPurge]);

  return { purged, running };
}
