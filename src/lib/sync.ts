import {
  collection,
  doc,
  getDocsFromServer,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { AppState } from 'react-native';
import { applyRemote, get, meta, onLocalWrite, outbox } from '@/db';
import { localOnly, tableNames, type Alarm, type TableName, type Tables } from '@/db/schema';
import { formatCursor, newest, parseCursor, ZERO } from './cursor';
import { friendlyError } from './errors';
import { auth, firestore } from './firebase';
import { mergeRemote, stripLocal } from './merge';
import { isOnline, onOnline } from './net';
import { schedule } from './notifications';

let running = false;
let again = false;
let generation = 0;

const status = { syncing: false, lastError: null as string | null, lastAt: 0 };
const subs = new Set<() => void>();
export const syncStatus = () => status;
export const onSyncChange = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
const emit = () => subs.forEach((f) => f());

const cursorKey = (table: TableName) => `syncedAt:${table}`;

async function pull(uid: string, table: TableName, gen: number) {
  const cursor = parseCursor(meta.get(cursorKey(table)));
  const ref = collection(firestore, 'users', uid, table);
  const snap = await getDocsFromServer(
    cursor ? query(ref, where('syncedAt', '>', new Timestamp(cursor.seconds, cursor.nanoseconds))) : ref,
  );
  if (gen !== generation) return;
  const winners: Tables[TableName][] = [];
  const stamps: (Timestamp | undefined)[] = [];
  for (const d of snap.docs) {
    // syncedAt exists only on the server; SQLite has no such column.
    const { syncedAt, ...remote } = d.data() as Tables[TableName] & { syncedAt?: Timestamp };
    stamps.push(syncedAt);
    const merged = mergeRemote(get(table, remote.id), remote as Tables[TableName], localOnly[table]);
    if (merged) winners.push(merged);
  }
  applyRemote(table, winners);
  outbox.discard(
    table,
    winners.map((w) => w.id),
  );
  meta.set(cursorKey(table), formatCursor(newest(cursor, stamps) ?? ZERO));
  if (table === 'alarms')
    for (const a of winners as Alarm[]) {
      if (gen !== generation) return;
      await schedule(a.id);
    }
}

async function push(uid: string, gen: number) {
  const pending = outbox.pending();
  for (let i = 0; i < pending.length; i += 400) {
    const chunk = pending.slice(i, i + 400);
    const batch = writeBatch(firestore);
    for (const p of chunk) {
      const row = get(p.tbl, p.rowId);
      if (row)
        batch.set(doc(firestore, 'users', uid, p.tbl, p.rowId), {
          ...stripLocal(row, localOnly[p.tbl]),
          syncedAt: serverTimestamp(),
        });
    }
    await batch.commit();
    if (gen !== generation) return;
    outbox.ack(chunk.map((c) => c.seq));
  }
}

export async function runSync() {
  const uid = auth.currentUser?.uid;
  if (!uid || !isOnline()) return;
  if (running) {
    again = true;
    return;
  }
  const gen = generation;
  running = true;
  status.syncing = true;
  status.lastError = null;
  emit();
  try {
    do {
      again = false;
      for (const t of tableNames) {
        await pull(uid, t, gen);
        if (gen !== generation) return;
      }
      await push(uid, gen);
      if (gen !== generation) return;
      status.lastAt = Date.now();
    } while (again && gen === generation && isOnline() && auth.currentUser?.uid === uid);
  } catch (e) {
    if (gen === generation) status.lastError = friendlyError(e);
  } finally {
    if (gen === generation) {
      running = false;
      status.syncing = false;
      emit();
    }
  }
}

export const syncNow = () => void runSync();

export function abortSync() {
  generation++;
  running = false;
  again = false;
  status.syncing = false;
  status.lastError = null;
  status.lastAt = 0;
  emit();
}

export function startSyncLoop() {
  const offOnline = onOnline(() => void runSync());
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') void runSync();
  });
  let t: ReturnType<typeof setTimeout> | undefined;
  const offWrites = onLocalWrite(() => {
    clearTimeout(t);
    t = setTimeout(() => void runSync(), 1500);
  });
  void runSync();
  return () => {
    offOnline();
    sub.remove();
    offWrites();
    clearTimeout(t);
  };
}
