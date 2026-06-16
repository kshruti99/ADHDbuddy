import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage';
import type { AnchorItem } from '@/lib/supabase';
import { buildAnchorTimestamps, getAnchorDate } from '@/lib/time';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function sortedByTime(anchors: AnchorItem[]): AnchorItem[] {
  const now = new Date();
  return [...anchors].sort((a, b) => {
    const da = getAnchorDate(a, now)?.getTime() ?? Infinity;
    const db = getAnchorDate(b, now)?.getTime() ?? Infinity;
    return da - db;
  });
}

export function useAnchors() {
  const [anchors, setAnchors] = useState<AnchorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await storageGet<AnchorItem[]>(STORAGE_KEYS.ANCHORS, []);
    setAnchors(sortedByTime(all));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  async function save(
    title: string,
    timeText: string,
    commuteMin: number,
    prepMin: number,
    editing?: AnchorItem | null
  ) {
    const timestamps = buildAnchorTimestamps(timeText, commuteMin, prepMin);
    if (!timestamps) return false;

    const all = await storageGet<AnchorItem[]>(STORAGE_KEYS.ANCHORS, []);

    if (editing) {
      const updated = all.map((a) =>
        a.id === editing.id
          ? {
              ...a,
              title: title.trim(),
              anchor_time: timestamps.anchor_time,
              anchor_at: timestamps.anchor_at,
              feet_on_floor_at: timestamps.feet_on_floor_at,
              feet_on_floor_time: null,
              commute_min: commuteMin,
              prep_min: prepMin,
            }
          : a
      );
      await storageSet(STORAGE_KEYS.ANCHORS, updated);
    } else {
      const newAnchor: AnchorItem = {
        id: makeId(),
        title: title.trim(),
        anchor_time: timestamps.anchor_time,
        anchor_at: timestamps.anchor_at,
        feet_on_floor_at: timestamps.feet_on_floor_at,
        feet_on_floor_time: null,
        commute_min: commuteMin,
        prep_min: prepMin,
        created_at: new Date().toISOString(),
      };
      await storageSet(STORAGE_KEYS.ANCHORS, [...all, newAnchor]);
    }
    await load();
    return true;
  }

  async function removeFromToday(anchor: AnchorItem) {
    const all = await storageGet<AnchorItem[]>(STORAGE_KEYS.ANCHORS, []);
    const updated = all.filter((a) => a.id !== anchor.id);
    await storageSet(STORAGE_KEYS.ANCHORS, updated);
    setAnchors((prev) => prev.filter((a) => a.id !== anchor.id));
  }

  return { anchors, loading, save, removeFromToday, reload: load };
}
