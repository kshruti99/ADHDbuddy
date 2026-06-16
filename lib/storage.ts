import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  FOCUS: 'adhd_focus',
  BACKLOG: 'adhd_backlog',
  HISTORY: 'adhd_history',
  ANCHORS: 'adhd_anchors',
  SIDE_QUESTS: 'adhd_side_quests',
  TASK_BREAKDOWNS: 'adhd_task_breakdowns',
  SCHEDULES: 'adhd_schedules',
  LAST_ACTIVE_DATE: 'adhd_last_active_date',
} as const;

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('storageSet error:', key, err);
  }
}
