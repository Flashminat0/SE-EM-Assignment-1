export const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function fmtMin(min: number) {
  const h = Math.floor(min / 60) % 24,
    m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
export const fmtTime = (ms: number) => {
  const d = new Date(ms);
  return fmtMin(d.getHours() * 60 + d.getMinutes());
};
export function fmtDate(ms: number) {
  const d = new Date(ms),
    now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
}
export const fmtDateTime = (ms: number) => `${fmtDate(ms)} · ${fmtTime(ms)}`;

export function relative(ms: number, now = Date.now()) {
  const diff = ms - now,
    abs = Math.abs(diff);
  if (abs < 86_400_000) {
    const [n, unit] =
      abs < 3_600_000
        ? ([Math.max(1, Math.round(abs / 60_000)), 'min'] as const)
        : ([Math.round(abs / 3_600_000), 'h'] as const);
    return diff >= 0 ? `in ${n} ${unit}` : `overdue by ${n} ${unit}`;
  }
  const days = Math.max(1, Math.round(Math.abs(startOfDay(ms) - startOfDay(now)) / 86_400_000));
  if (diff > 0) return days === 1 ? 'tomorrow' : `in ${days} days`;
  return `overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function ago(ms: number, now = Date.now()) {
  const diff = Math.max(0, now - ms);
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000 && isSameDay(ms, now)) return `${Math.floor(diff / 3_600_000)} h`;
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86_400_000);
  if (days <= 1) return 'Yesterday';
  if (days < 7) return `${days} days`;
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

export function dateOfWeekday(anchor: number, weekday: number) {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const fromMonday = (d.getDay() + 6) % 7; // Mon 0 … Sun 6
  const target = (weekday + 6) % 7;
  d.setDate(d.getDate() - fromMonday + target);
  return d.getTime();
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')[0] ?? '')
    .join('')
    .toUpperCase();

export const courseLabel = (code: string, name: string) => {
  const i = initials(name);
  return i ? `${code}-${i}` : code;
};

export const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const isToday = (ms: number) => startOfDay(ms) === startOfDay(Date.now());

export function nextOccurrence(weekday: number, startMin: number, from = Date.now()) {
  const d = new Date(from);
  d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= from) delta = 7;
  d.setDate(d.getDate() + delta);
  return d.getTime();
}
