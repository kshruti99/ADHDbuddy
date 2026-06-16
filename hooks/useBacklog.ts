import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage';
import type { BacklogItem, FocusItem } from '@/lib/supabase';
import type { EnergyTag, Mode } from '@/lib/constants';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useBacklog(mode: Mode) {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await storageGet<BacklogItem[]>(STORAGE_KEYS.BACKLOG, []);
    setItems(all.filter((b) => b.mode === mode));
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

  async function persist(updated: BacklogItem[]) {
    const all = await storageGet<BacklogItem[]>(STORAGE_KEYS.BACKLOG, []);
    const otherModes = all.filter((b) => b.mode !== mode);
    await storageSet(STORAGE_KEYS.BACKLOG, [...otherModes, ...updated]);
    setItems(updated);
  }

  async function add(content: string, energyTag: EnergyTag = 'quick_win') {
    if (!content.trim()) return;
    const newItem: BacklogItem = {
      id: makeId(),
      content: content.trim(),
      mode,
      energy_tag: energyTag,
      completed: false,
      created_at: new Date().toISOString(),
    };
    await persist([newItem, ...items]);
  }

  async function toggle(item: BacklogItem) {
    const updated = items.map((b) =>
      b.id === item.id ? { ...b, completed: !b.completed } : b
    );
    await persist(updated);
  }

  async function markDone(item: BacklogItem) {
    if (!item.completed) await toggle(item);
  }

  async function deprioritize(item: BacklogItem) {
    const rest = items.filter((b) => b.id !== item.id);
    await persist([...rest, { ...item, completed: false }]);
  }

  async function removeFromToday(item: BacklogItem) {
    const updated = items.map((b) =>
      b.id === item.id ? { ...b, completed: true } : b
    );
    await persist(updated);
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
    // Add to focus storage
    const allFocus = await storageGet<FocusItem[]>(STORAGE_KEYS.FOCUS, []);
    const newFocusItem: FocusItem = {
      id: makeId(),
      content: item.content,
      mode,
      position: focusCount,
      completed: false,
      created_at: new Date().toISOString(),
    };
    await storageSet(STORAGE_KEYS.FOCUS, [...allFocus, newFocusItem]);

    // Remove from backlog
    const updated = items.filter((b) => b.id !== item.id);
    await persist(updated);
    return true;
  }

  async function clearFinished() {
    const updated = items.filter((b) => !b.completed);
    await persist(updated);
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
