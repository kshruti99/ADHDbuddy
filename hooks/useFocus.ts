import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage';
import type { FocusItem, TaskHistory } from '@/lib/supabase';
import type { Mode } from '@/lib/constants';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useFocus(mode: Mode) {
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overflow, setOverflow] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all = await storageGet<FocusItem[]>(STORAGE_KEYS.FOCUS, []);
    setItems(all.filter((f) => f.mode === mode));
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

  async function persist(updated: FocusItem[]) {
    // Merge: keep items from other modes, replace this mode's items
    const all = await storageGet<FocusItem[]>(STORAGE_KEYS.FOCUS, []);
    const otherModes = all.filter((f) => f.mode !== mode);
    await storageSet(STORAGE_KEYS.FOCUS, [...otherModes, ...updated]);
    setItems(updated);
  }

  const activeCount = items.filter((f) => !f.completed).length;

  async function add(content: string) {
    if (!content.trim()) return false;
    if (activeCount >= 3) {
      setOverflow(content.trim());
      return false;
    }
    const newItem: FocusItem = {
      id: makeId(),
      content: content.trim(),
      mode,
      position: items.length,
      completed: false,
      created_at: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    await persist(updated);
    return true;
  }

  async function toggle(item: FocusItem) {
    const updated = items.map((f) =>
      f.id === item.id ? { ...f, completed: !f.completed } : f
    );
    await persist(updated);
  }

  async function markDone(item: FocusItem) {
    if (!item.completed) await toggle(item);
  }

  async function removeFromToday(item: FocusItem) {
    const updated = items.map((f) =>
      f.id === item.id ? { ...f, completed: true } : f
    );
    await persist(updated);
  }

  async function clearFinished() {
    const updated = items.filter((f) => !f.completed);
    await persist(updated);
  }

  /** Writes item to task_history (localStorage) and removes it from current focus. */
  async function complete(item: FocusItem) {
    const historyEntry: TaskHistory = {
      id: makeId(),
      content: item.content,
      mode: item.mode,
      completed_at: new Date().toISOString(),
      source_focus_id: item.id,
      created_at: new Date().toISOString(),
    };
    const history = await storageGet<TaskHistory[]>(STORAGE_KEYS.HISTORY, []);
    await storageSet(STORAGE_KEYS.HISTORY, [historyEntry, ...history]);

    const updated = items.filter((f) => f.id !== item.id);
    await persist(updated);
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
