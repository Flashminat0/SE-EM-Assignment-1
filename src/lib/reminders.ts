import type { Alarm } from '@/db/schema';

const MIN = 60_000;

export const reminderOptions = [
  { minutes: 0, label: 'At time' },
  { minutes: 60, label: '1 h before' },
  { minutes: 24 * 60, label: '1 day before' },
  { minutes: 2 * 24 * 60, label: '2 days before' },
  { minutes: 7 * 24 * 60, label: '1 week before' },
] as const;
const presets: readonly number[] = reminderOptions.map((o) => o.minutes);

export function reminderTimes(at: number, offsetsMin: number[], now = Date.now()): number[] {
  return [...new Set(offsetsMin)]
    .map((m) => at - m * MIN)
    .filter((t) => t > now)
    .sort((a, b) => a - b);
}

export const reminderPassed = (at: number, offsetMin: number, now: number) => at - offsetMin * MIN <= now;

export function defaultOffsets(at: number, now: number, wanted: readonly number[] = [24 * 60]): number[] {
  const ahead = wanted.filter((m) => !reminderPassed(at, m, now));
  if (ahead.length) return [...ahead];
  const fallback = [24 * 60, 60, 0].find((m) => !reminderPassed(at, m, now));
  return fallback === undefined ? [] : [fallback];
}

export function offsetsFrom(at: number, fireTimes: number[]): number[] {
  return [...new Set(fireTimes.map((t) => Math.round((at - t) / MIN)))]
    .filter((m) => presets.includes(m))
    .sort((a, b) => a - b);
}

export function snoozedAlarm(a: Alarm, minutes: number, now: number, newId: () => string): Alarm {
  return { ...a, id: newId(), fireAt: now + minutes * MIN, weekly: 0, deletedAt: null };
}

export const LECTURE_REMIND_MIN = 15;

export function lectureReminderAt(weekday: number, startMin: number, before = LECTURE_REMIND_MIN) {
  const m = startMin - before;
  return m >= 0 ? { weekday, minute: m } : { weekday: (weekday + 6) % 7, minute: m + 24 * 60 };
}

export const LAST_MINUTE = 24 * 60 - 1;
export const lectureEndError = (startMin: number, endMin: number) =>
  endMin <= startMin ? 'Ends must be after it starts.' : '';
