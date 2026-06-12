import { useCallback, useEffect, useState } from 'react';
import { supabase, type BacklogItem } from '@/lib/supabase';
import type { EnergyTag, Mode } from '@/lib/constants';

export function useBacklog(mode: Mode) {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('brain_backlog')
      .select('*')
      .eq('mode', mode)
      .order('created_at', { ascending: false });
    if (data) setItems(data as BacklogItem[]);
    if (error) console.error('loadBacklog error:', error);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  async function add(content: string, energyTag: EnergyTag = 'quick_win') {
    if (!content.trim()) return;
    const { data } = await supabase
      .from('brain_backlog')
      .insert({ content: content.trim(), mode, energy_tag: energyTag })
      .select()
      .maybeSingle();
    if (data) setItems((prev) => [data as BacklogItem, ...prev]);
  }

  async function toggle(item: BacklogItem) {
    const updated = !item.completed;
    await supabase.from('brain_backlog').update({ completed: updated }).eq('id', item.id);
    setItems((prev) => prev.map((b) => (b.id === item.id ? { ...b, completed: updated } : b)));
  }

  async function markDone(item: BacklogItem) {
    if (!item.completed) await toggle(item);
  }

  async function deprioritize(item: BacklogItem) {
    await supabase.from('brain_backlog').update({ completed: false }).eq('id', item.id);
    setItems((prev) => {
      const rest = prev.filter((b) => b.id !== item.id);
      return [...rest, item];
    });
  }

  async function removeFromToday(item: BacklogItem) {
    await supabase.from('brain_backlog').update({ completed: true }).eq('id', item.id);
    setItems((prev) => prev.map((b) => (b.id === item.id ? { ...b, completed: true } : b)));
  }

  async function promoteToFocus(
    item: BacklogItem,
    focusCount: number,
    onOverflow: (content: string) => void
  ) {
    if (focusCount >= 3) {
      onOverflow(item.content);
      return false;
    }
    await supabase.from('current_focus').insert({
      content: item.content,
      mode,
      position: focusCount,
    });
    await supabase.from('brain_backlog').delete().eq('id', item.id);
    setItems((prev) => prev.filter((b) => b.id !== item.id));
    return true;
  }

  async function clearFinished() {
    const finished = items.filter((b) => b.completed);
    await Promise.all(
      finished.map((b) => supabase.from('brain_backlog').delete().eq('id', b.id))
    );
    setItems((prev) => prev.filter((b) => !b.completed));
  }

  return {
    items,
    loading,
    incomplete: items.filter((b) => !b.completed),
    completed: items.filter((b) => b.completed),
    add,
    toggle,
    markDone,
    deprioritize,
    removeFromToday,
    promoteToFocus,
    clearFinished,
    reload: load,
  };
}
