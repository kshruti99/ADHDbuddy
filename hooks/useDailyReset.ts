import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { localDayKey, startOfTodayISO } from '@/lib/dayBoundary';
import type { Mode } from '@/lib/constants';

const LAST_ACTIVE_KEY = 'adhd_last_active_date';

/**
 * Runs the Midnight Purge on first mount and on app foreground transitions.
 *
 * Purge behaviour:
 * - Incomplete current_focus items older than today → moved to brain_backlog vault.
 * - Completed current_focus items older than today → deleted (already recorded in task_history).
 * - Writes today's date key so the purge only runs once per day.
 *
 * Returns `purged` (true if a purge just ran) so the dashboard can open in
 * Clean Slate state on a fresh day.
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
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);

      if (lastActive === today) {
        setRunning(false);
        return;
      }

      const cutoff = startOfTodayISO();

      // Fetch stale incomplete items for this mode
      const { data: staleIncomplete } = await supabase
        .from('current_focus')
        .select('*')
        .eq('mode', mode)
        .eq('completed', false)
        .lt('created_at', cutoff);

      if (staleIncomplete && staleIncomplete.length > 0) {
        // Move to brain_backlog vault
        await supabase.from('brain_backlog').insert(
          staleIncomplete.map((item) => ({
            content: item.content,
            mode: item.mode,
            energy_tag: 'quick_win',
            completed: false,
          }))
        );
        await supabase
          .from('current_focus')
          .delete()
          .in('id', staleIncomplete.map((i) => i.id));
      }

      // Delete stale completed items (already in task_history)
      await supabase
        .from('current_focus')
        .delete()
        .eq('mode', mode)
        .eq('completed', true)
        .lt('created_at', cutoff);

      await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
      setPurged(true);
      onComplete?.();
    } catch (err) {
      console.error('useDailyReset error:', err);
    } finally {
      setRunning(false);
    }
  }, [mode, onComplete]);

  // Run on mount
  useEffect(() => {
    runPurge();
  }, [runPurge]);

  // Re-run when app comes back to foreground (e.g. left open overnight)
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
