import type { AnchorItem } from '@/lib/supabase';

export function parseAnchorTime(text: string, baseDate: Date = new Date()): Date | null {
  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const d = new Date(baseDate);
  d.setHours(hours, mins, 0, 0);
  return d;
}

export function getAnchorDate(anchor: AnchorItem, now: Date = new Date()): Date | null {
  if (anchor.anchor_at) return new Date(anchor.anchor_at);
  return parseAnchorTime(anchor.anchor_time, now);
}

export function getFeetOnFloorDate(anchor: AnchorItem, now: Date = new Date()): Date | null {
  if (anchor.feet_on_floor_at) return new Date(anchor.feet_on_floor_at);
  const anchorDate = getAnchorDate(anchor, now);
  if (!anchorDate) return null;
  const bufferMs = (anchor.commute_min + anchor.prep_min) * 60000;
  return new Date(anchorDate.getTime() - bufferMs);
}

export function formatTimeShort(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatRelative(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return 'now';
  if (diffMin > 0) {
    if (diffMin < 60) return `in ${diffMin} min`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
  }
  const abs = Math.abs(diffMin);
  if (abs < 60) return `${abs} min ago`;
  const h = Math.floor(abs / 60);
  return `${h}h ago`;
}

export function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export type SortedAnchors = {
  past: AnchorItem[];
  current: AnchorItem | null;
  upcoming: AnchorItem[];
};

export function sortAnchorsByTime(anchors: AnchorItem[], now: Date): SortedAnchors {
  const withDates = anchors
    .map((a) => ({ anchor: a, at: getAnchorDate(a, now) }))
    .filter((x): x is { anchor: AnchorItem; at: Date } => x.at !== null && isToday(x.at, now))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const past: AnchorItem[] = [];
  const upcoming: AnchorItem[] = [];
  let current: AnchorItem | null = null;

  for (const { anchor, at } of withDates) {
    const feet = getFeetOnFloorDate(anchor, now);
    const feetTime = feet?.getTime() ?? at.getTime();
    const endTime = at.getTime();

    if (now.getTime() > endTime) {
      past.push(anchor);
    } else if (now.getTime() >= feetTime && now.getTime() <= endTime) {
      current = anchor;
      upcoming.push(anchor);
    } else {
      upcoming.push(anchor);
    }
  }

  return { past, current, upcoming };
}

export function getNextAnchor(anchors: AnchorItem[], now: Date): AnchorItem | null {
  const { upcoming } = sortAnchorsByTime(anchors, now);
  return upcoming[0] ?? null;
}

export function buildAnchorTimestamps(
  timeText: string,
  commuteMin: number,
  prepMin: number,
  baseDate: Date = new Date()
): { anchor_at: string; feet_on_floor_at: string; anchor_time: string } | null {
  const anchorDate = parseAnchorTime(timeText, baseDate);
  if (!anchorDate) return null;
  const bufferMs = (commuteMin + prepMin) * 60000;
  const feetDate = new Date(anchorDate.getTime() - bufferMs);
  return {
    anchor_at: anchorDate.toISOString(),
    feet_on_floor_at: feetDate.toISOString(),
    anchor_time: formatTimeShort(anchorDate),
  };
}

export type PlanBlock = {
  label: string;
  time: Date;
  coaching: string;
};

export function buildPlanBlocks(
  title: string,
  eventTime: Date,
  prepMin: number,
  commuteMin: number
): PlanBlock[] {
  const leaveBy = new Date(eventTime.getTime() - commuteMin * 60000);
  const prepStart = new Date(leaveBy.getTime() - prepMin * 60000);
  const feetOnFloor = prepStart;

  return [
    {
      label: 'Event',
      time: eventTime,
      coaching: title,
    },
    {
      label: 'Leave by',
      time: leaveBy,
      coaching: "Out the door. Don't start anything new.",
    },
    {
      label: 'Start prep',
      time: prepStart,
      coaching: 'Shower, gather papers, whatever prep means for this.',
    },
    {
      label: 'Feet on floor',
      time: feetOnFloor,
      coaching: "Stand up. Shoes. Keys. That's it.",
    },
  ].reverse();
}
