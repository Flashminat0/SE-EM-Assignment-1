export type Member = { uid: string; displayName: string };
export type Channel = {
  id: string;
  kind: 'dm' | 'group';
  name: string;
  memberIds: string[];
  members: Record<string, Member>;
  lastMessageAt: number;
  lastMessageText: string;
  blockedBy: string[];
};
export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
  pending?: boolean;
};

export const LIMITS = { name: 80, preview: 200, text: 2000 } as const;

const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function toMember(uid: string, v: unknown): Member {
  const m = obj(v) ?? {};
  return { uid, displayName: str(m.displayName, LIMITS.name).trim() || 'Unknown' };
}

export function toChannel(id: unknown, v: unknown): Channel | null {
  const d = obj(v);
  if (!d || typeof id !== 'string' || !id) return null;
  const memberIds = Array.isArray(d.memberIds)
    ? d.memberIds.filter((m): m is string => typeof m === 'string' && m.length > 0)
    : [];
  if (memberIds.length === 0) return null;
  const raw = obj(d.members) ?? {};
  return {
    id,
    kind: d.kind === 'group' ? 'group' : 'dm',
    name: str(d.name, LIMITS.name),
    memberIds,
    members: Object.fromEntries(memberIds.map((uid) => [uid, toMember(uid, raw[uid])])),
    lastMessageAt: num(d.lastMessageAt),
    lastMessageText: str(d.lastMessageText, LIMITS.preview),
    blockedBy: Array.isArray(d.blockedBy)
      ? d.blockedBy.filter((m): m is string => typeof m === 'string' && memberIds.includes(m))
      : [],
  };
}

export function toMessage(id: unknown, v: unknown, createdAt: number, pending = false): Message | null {
  const m = obj(v);
  if (!m || typeof id !== 'string' || !id) return null;
  return {
    id,
    senderId: str(m.senderId, 128),
    senderName: str(m.senderName, LIMITS.name) || 'Unknown',
    text: str(m.text, LIMITS.text),
    createdAt,
    pending,
  };
}

export const parseChannels = (rows: unknown): Channel[] =>
  Array.isArray(rows) ? rows.map((r) => toChannel(obj(r)?.id, r)).filter((c): c is Channel => c !== null) : [];
export const parseMessages = (rows: unknown): Message[] =>
  Array.isArray(rows)
    ? rows.map((r) => toMessage(obj(r)?.id, r, num(obj(r)?.createdAt))).filter((m): m is Message => m !== null)
    : [];

export function mergeById<T extends { id: string }>(saved: T[], fresh: T[], newestFirst: (a: T, b: T) => number): T[] {
  const byId = new Map(saved.map((r) => [r.id, r]));
  for (const r of fresh) byId.set(r.id, r);
  return [...byId.values()].sort(newestFirst);
}

export const previewText = (text: string) => text.slice(0, LIMITS.preview);
