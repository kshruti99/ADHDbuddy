/** Returns YYYY-MM-DD in local time for the given date (defaults to now). */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the ISO-8601 timestamp for local midnight today (start of today in UTC). */
export function startOfTodayISO(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return midnight.toISOString();
}
