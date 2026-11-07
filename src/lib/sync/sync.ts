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
import { friendlyError } from '@/lib/util/errors';
import { auth, firestore } from '@/lib/auth/firebase';
import { mergeRemote, stripLocal } from '@/lib/sync/merge';
import { isOnline, onOnline } from '@/lib/sync/net';
import { schedule } from '@/lib/alarms/notifications';

type Cursor = { seconds: number; nanoseconds: number };

const ZERO: Cursor = { seconds: 0, nanoseconds: 0 };

// Kept as text: a Firestore timestamp has nanoseconds, a JS number does not
const formatCursor = (c: Cursor) => `${c.seconds}.${String(c.nanoseconds).padStart(9, '0')}`;

function parseCursor(s: string | null): Cursor | null {
  const m = s?.match(/^(\d+)\.(\d{9})$/);
  return m ? { seconds: Number(m[1]), nanoseconds: Number(m[2]) } : null;
}

const isAfter = (a: Cursor, b: Cursor) =>
  a.seconds > b.seconds || (a.seconds === b.seconds && a.nanoseconds > b.nanoseconds);

function newest(start: Cursor | null, stamps: (Cursor | undefined | null)[]): Cursor | null {
  let max = start;

  for (const s of stamps) if (s && (!max || isAfter(s, max))) max = { seconds: s.seconds, nanoseconds: s.nanoseconds };
  return max;
}

let running = false;

let again = false;

// Bumped on sign-out, so a pass still in flight throws its results away
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
  // Server-side cursor: the phone's own clock cannot hide a late offline edit
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

  // Firestore caps a batch at 500 writes
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
    // Only after the commit, or a crash in between would lose the change
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

  // Pull first: an edit queued offline must meet newer edits before it is pushed
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

  // Typing in an editor fires several writes; wait for them to settle
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
