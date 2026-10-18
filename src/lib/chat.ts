import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { chatCache } from '@/db';
import { cachedProfile, ensureProfile } from './auth';
import {
  LIMITS,
  mergeById,
  parseChannels,
  parseMessages,
  previewText,
  toChannel,
  toMember,
  toMessage,
  type Channel,
  type Member,
  type Message,
} from './chat-parse';
import { friendlyError, userError } from './errors';
import { auth, firestore } from './firebase';

export type { Channel, Member, Message };
export type Live<T> = { rows: T; error: string | null };

type Doc = QueryDocumentSnapshot<DocumentData>;

const me = () => {
  const u = auth.currentUser;
  if (!u) throw userError('You are signed out. Sign in again.');
  return u;
};
const ms = (t: Timestamp | number | null | undefined) => (typeof t === 'number' ? t : (t?.toMillis?.() ?? Date.now()));
const savedChannels = () => parseChannels(chatCache.read<unknown>('channels'));

const readChannel = (d: Doc) => toChannel(d.id, d.data());
const readMessage = (d: Doc) => {
  const x = d.data({ serverTimestamps: 'estimate' });
  return toMessage(d.id, x, ms(x.createdAt), d.metadata.hasPendingWrites);
};
const byActivity = (a: Channel, b: Channel) => b.lastMessageAt - a.lastMessageAt;
const byTime = (a: Message, b: Message) => b.createdAt - a.createdAt;

function useLive<T extends { id: string; pending?: boolean }>(
  key: string,
  q: Query,
  saved: () => T[],
  read: (d: Doc) => T | null,
  order: (a: T, b: T) => number,
): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>(() => ({ rows: saved(), error: null }));
  useEffect(
    () =>
      onSnapshot(
        q,
        { includeMetadataChanges: true },
        (s) => {
          const rows = s.docs.map(read).filter((r): r is T => r !== null);
          if (s.metadata.fromCache) {
            setState((prev) => ({ rows: mergeById(prev.rows, rows, order).slice(0, 50), error: prev.error }));
            return;
          }
          chatCache.write(
            key,
            rows.filter((r) => !r.pending),
          );
          setState({ rows, error: null });
        },
        (e) => setState((prev) => ({ rows: prev.rows, error: friendlyError(e) })),
      ),
    [key, q, read, order],
  );
  return state;
}

export function useChannels(): Live<Channel[]> {
  const uid = auth.currentUser?.uid ?? '';
  const q = useMemo(
    () =>
      query(
        collection(firestore, 'channels'),
        where('memberIds', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc'),
        limit(30),
      ),
    [uid],
  );
  return useLive('channels', q, savedChannels, readChannel, byActivity);
}

export function useMessages(channelId: string): Live<Message[]> {
  const key = `messages:${channelId}`;
  const q = useMemo(
    () => query(collection(firestore, 'channels', channelId, 'messages'), orderBy('createdAt', 'desc'), limit(50)),
    [channelId],
  );
  return useLive(key, q, () => parseMessages(chatCache.read<unknown>(key)), readMessage, byTime);
}

export function useChannel(id: string): Channel | null {
  const [ch, setCh] = useState<Channel | null>(() => savedChannels().find((c) => c.id === id) ?? null);
  useEffect(
    () =>
      onSnapshot(
        doc(firestore, 'channels', id),
        (s) => {
          if (s.exists()) setCh(toChannel(s.id, s.data()));
        },
        () => {},
      ),
    [id],
  );
  return ch;
}

export function blockState(ch: Channel, uid: string): 'none' | 'byMe' | 'byThem' {
  return ch.blockedBy.includes(uid) ? 'byMe' : ch.blockedBy.length ? 'byThem' : 'none';
}

export const setBlocked = (channelId: string, block: boolean) =>
  updateDoc(doc(firestore, 'channels', channelId), { blockedBy: block ? arrayUnion(me().uid) : arrayRemove(me().uid) });

export async function listPeople(): Promise<Member[]> {
  const s = await getDocs(query(collection(firestore, 'users'), limit(100)));
  return s.docs
    .map((d) => toMember(d.id, d.data()))
    .filter((m) => m.displayName !== 'Unknown' && m.uid !== auth.currentUser?.uid)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function myself(): Promise<Member> {
  const u = me();
  const p = cachedProfile() ?? (await ensureProfile(u));
  if (!p) throw userError('Your profile is not set up yet. Check your connection and try again.');
  return { uid: u.uid, displayName: p.displayName };
}

const channelDoc = (kind: 'dm' | 'group', name: string, everyone: Member[]) => ({
  kind,
  name,
  memberIds: everyone.map((m) => m.uid).sort(),
  members: Object.fromEntries(everyone.map((m) => [m.uid, m])),
  lastMessageAt: Date.now(),
  lastMessageText: '',
  blockedBy: [],
});

export async function openChannel(others: Member[], name?: string): Promise<string> {
  const everyone = [await myself(), ...others.map((m) => toMember(m.uid, m))];
  if (others.length > 1) {
    const title = (name?.trim() || everyone.map((m) => m.displayName.split(' ')[0]).join(', ')).slice(0, LIMITS.name);
    const r = await addDoc(collection(firestore, 'channels'), channelDoc('group', title, everyone));
    return r.id;
  }
  const dm = channelDoc('dm', '', everyone);
  const id = dm.memberIds.join('_');
  const ref = doc(firestore, 'channels', id);
  if (!(await getDoc(ref)).exists()) await setDoc(ref, dm);
  return id;
}

export async function sendMessage(channelId: string, text: string) {
  const self = await myself();
  const body = text.slice(0, LIMITS.text);
  const batch = writeBatch(firestore);
  batch.set(doc(collection(firestore, 'channels', channelId, 'messages')), {
    senderId: self.uid,
    senderName: self.displayName,
    text: body,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(firestore, 'channels', channelId), {
    lastMessageAt: Date.now(),
    lastMessageText: previewText(body),
  });
  await batch.commit();
}

export function channelTitle(ch: Channel, uid: string) {
  if (ch.kind === 'group') return ch.name || 'Group chat';
  const other = ch.memberIds.find((m) => m !== uid);
  return (other && ch.members[other]?.displayName) || 'Direct message';
}
