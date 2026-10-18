export type Cursor = { seconds: number; nanoseconds: number };

export const ZERO: Cursor = { seconds: 0, nanoseconds: 0 };
export const formatCursor = (c: Cursor) => `${c.seconds}.${String(c.nanoseconds).padStart(9, '0')}`;
export function parseCursor(s: string | null): Cursor | null {
  const m = s?.match(/^(\d+)\.(\d{9})$/);
  return m ? { seconds: Number(m[1]), nanoseconds: Number(m[2]) } : null;
}
export const isAfter = (a: Cursor, b: Cursor) =>
  a.seconds > b.seconds || (a.seconds === b.seconds && a.nanoseconds > b.nanoseconds);
export function newest(start: Cursor | null, stamps: (Cursor | undefined | null)[]): Cursor | null {
  let max = start;
  for (const s of stamps) if (s && (!max || isAfter(s, max))) max = { seconds: s.seconds, nanoseconds: s.nanoseconds };
  return max;
}
