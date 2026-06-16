import { useCallback, useEffect, useState } from 'react';
import { supabase, type FocusItem } from '@/lib/supabase';
import type { Mode } from '@/lib/constants';

export function useFocus(mode: Mode) {
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overflow, setOverflow] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('current_focus')
      .select('*')
      .eq('mode', mode)
      .order('position');
    if (data) setItems(data as FocusItem[]);
    if (error) console.error('loadFocus error:', error);
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

  const activeCount = items.filter((f) => !f.completed).length;

  async function add(content: string) {
    if (!content.trim()) return false;
    if (activeCount >= 3) {
      setOverflow(content.trim());
      return false;
    }
    const { data } = await supabase
      .from('current_focus')
      .insert({ content: content.trim(), mode, position: items.length })
      .select()
      .maybeSingle();
    if (data) setItems((prev) => [...prev, data as FocusItem]);
    return true;
  }

  async function toggle(item: FocusItem) {
    const updated = !item.completed;
    await supabase.from('current_focus').update({ completed: updated }).eq('id', item.id);
    setItems((prev) => prev.map((f) => (f.id === item.id ? { ...f, completed: updated } : f)));
  }

  async function markDone(item: FocusItem) {
    if (!item.completed) await toggle(item);
  }

  async function removeFromToday(item: FocusItem) {
    await supabase.from('current_focus').update({ completed: true }).eq('id', item.id);
    setItems((prev) => prev.map((f) => (f.id === item.id ? { ...f, completed: true } : f)));
  }

  async function clearFinished() {
    const finished = items.filter((f) => f.completed);
    await Promise.all(
      finished.map((f) => supabase.from('current_focus').delete().eq('id', f.id))
    );
    setItems((prev) => prev.filter((f) => !f.completed));
  }

  /** Marks a task done, writes it to task_history, and removes it from current_focus. */
  async function complete(item: FocusItem) {
    await supabase.from('task_history').insert({
      content: item.content,
      mode: item.mode,
      completed_at: new Date().toISOString(),
      source_focus_id: item.id,
    });
    await supabase.from('current_focus').delete().eq('id', item.id);
    setItems((prev) => prev.filter((f) => f.id !== item.id));
  }

  return {
    items,
    loading,
    overflow,
    setOverflow,
    active: items.filter((f) => !f.completed),
    completed: items.filter((f) => f.completed),
    add,
    toggle,
    markDone,
    removeFromToday,
    clearFinished,
    complete,
    reload: load,
  };
}
