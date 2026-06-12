import { useCallback, useEffect, useState } from 'react';
import { supabase, type AnchorItem } from '@/lib/supabase';
import { buildAnchorTimestamps, getAnchorDate } from '@/lib/time';

export function useAnchors() {
  const [anchors, setAnchors] = useState<AnchorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('anchors').select('*');
    if (data) {
      const now = new Date();
      const sorted = (data as AnchorItem[]).sort((a, b) => {
        const da = getAnchorDate(a, now)?.getTime() ?? Infinity;
        const db = getAnchorDate(b, now)?.getTime() ?? Infinity;
        return da - db;
      });
      setAnchors(sorted);
    }
    if (error) console.error('loadAnchors error:', error);
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

    const fullPayload = {
      title: title.trim(),
      anchor_time: timestamps.anchor_time,
      anchor_at: timestamps.anchor_at,
      feet_on_floor_at: timestamps.feet_on_floor_at,
      feet_on_floor_time: null,
      commute_min: commuteMin,
      prep_min: prepMin,
    };

    const legacyPayload = {
      title: title.trim(),
      anchor_time: timestamps.anchor_time,
      commute_min: commuteMin,
      prep_min: prepMin,
    };

    if (editing) {
      const { error } = await supabase.from('anchors').update(fullPayload).eq('id', editing.id);
      if (error) await supabase.from('anchors').update(legacyPayload).eq('id', editing.id);
    } else {
      const { error } = await supabase.from('anchors').insert(fullPayload);
      if (error) await supabase.from('anchors').insert(legacyPayload);
    }
    await load();
    return true;
  }

  async function removeFromToday(anchor: AnchorItem) {
    await supabase.from('anchors').delete().eq('id', anchor.id);
    setAnchors((prev) => prev.filter((a) => a.id !== anchor.id));
  }

  return { anchors, loading, save, removeFromToday, reload: load };
}
