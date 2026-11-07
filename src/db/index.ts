import { openDatabaseSync } from 'expo-sqlite';
import { useMemo, useSyncExternalStore } from 'react';
import { DDL, selectLive, type Base, type Course, type TableName, type Tables } from './schema';

type Listener = () => void;

type Param = string | number | null;

// --- open ---

export const db = openDatabaseSync('edu-alarm.db');
db.execSync(DDL);

const columnCache = new Map<TableName, Set<string>>();

function columnsOf(table: TableName) {
  let cols = columnCache.get(table);

  if (!cols) {
    cols = new Set(db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`).map((r) => r.name));
    columnCache.set(table, cols);
  }

  return cols;
}

// createdAt was added after the first release
for (const t of ['assignments', 'exams'] as const) {
  if (!columnsOf(t).has('createdAt')) {
    db.execSync(`ALTER TABLE ${t} ADD COLUMN createdAt INTEGER NOT NULL DEFAULT 0`);
    columnCache.delete(t);
  }
}

// --- change notifications ---

const changeListeners = new Set<Listener>();

const writeListeners = new Set<Listener>();

let version = 0;

function listen(set: Set<Listener>, l: Listener) {
  set.add(l);

  return () => {
    set.delete(l);
  };
}

// Any change to the database: screens re-run their queries
export function notifyChange() {
  version++;
  changeListeners.forEach((l) => l());
}

// A local write: the sync loop wakes up
const notifyWrite = () => writeListeners.forEach((l) => l());

export const onLocalWrite = (l: Listener) => listen(writeListeners, l);

// --- hooks ---

export function useQuery<T>(query: () => T, deps: readonly (string | number | boolean | null | undefined)[] = []): T {
  const v = useSyncExternalStore(
    (l) => listen(changeListeners, l),
    () => version,
    () => version,
  );

  const key = `${v}|${deps.join('|')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => query(), [key]);
}

export const useCourses = () =>
  useQuery(() => Object.fromEntries(all('courses').map((k) => [k.id, k])) as Record<string, Course>);

export const usePendingIds = (table: TableName) => useQuery(() => outbox.pendingIds(table), [table]);

// --- reads ---

export function all<K extends TableName>(
  table: K,
  where = '1=1',
  params: Param[] = [],
  order = 'updatedAt DESC',
): Tables[K][] {
  return db.getAllSync<Tables[K]>(selectLive(table, where, order), params);
}

export function get<K extends TableName>(table: K, id: string): Tables[K] | null {
  return db.getFirstSync<Tables[K]>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

// --- writes ---

function queueForSync(table: TableName, id: string) {
  db.runSync('INSERT INTO outbox (tbl, rowId, queuedAt) VALUES (?,?,?)', [table, id, Date.now()]);
}

function writeRow<K extends TableName>(table: K, row: Tables[K]) {
  const cols = Object.keys(row).filter((k) => columnsOf(table).has(k));
  const marks = cols.map(() => '?').join(',');
  const values = cols.map((c) => (row as Record<string, unknown>)[c] as Param);
  db.runSync(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${marks})`, values);
}

// Save a local change and queue it for sync
export function put<K extends TableName>(
  table: K,
  row: Omit<Tables[K], 'updatedAt' | 'deletedAt'> & Partial<Base>,
): Tables[K] {
  const full = { ...row, updatedAt: Date.now(), deletedAt: row.deletedAt ?? null } as Tables[K];
  db.withTransactionSync(() => {
    writeRow(table, full);
    queueForSync(table, full.id);
  });

  notifyChange();
  notifyWrite();
  return full;
}

// Soft delete, queued like any other change
export function remove(table: TableName, id: string) {
  const now = Date.now();
  db.withTransactionSync(() => {
    db.runSync(`UPDATE ${table} SET deletedAt = ?, updatedAt = ? WHERE id = ?`, [now, now, id]);
    queueForSync(table, id);
  });

  notifyChange();
  notifyWrite();
}

// Rows pulled from the server: written as they are, not queued
export function applyRemote<K extends TableName>(table: K, rows: Tables[K][]) {
  if (!rows.length) return;
  db.withTransactionSync(() => rows.forEach((r) => writeRow(table, r)));
  notifyChange();
}

// --- outbox ---

export const outbox = {
  pending: () =>
    db.getAllSync<{ seq: number; tbl: TableName; rowId: string }>('SELECT seq, tbl, rowId FROM outbox ORDER BY seq'),
  count: () => db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM outbox')?.n ?? 0,
  pendingIds: (table: TableName) =>
    new Set(
      db.getAllSync<{ rowId: string }>('SELECT DISTINCT rowId FROM outbox WHERE tbl = ?', [table]).map((r) => r.rowId),
    ),
  ack: (seqs: number[]) => {
    if (seqs.length) db.runSync(`DELETE FROM outbox WHERE seq IN (${seqs.join(',')})`);
    notifyChange();
  },
  discard: (table: TableName, rowIds: string[]) => {
    if (!rowIds.length) return;
    for (const id of rowIds) db.runSync('DELETE FROM outbox WHERE tbl = ? AND rowId = ?', [table, id]);
    notifyChange();
  },
};

// --- key-value stores ---

export const meta = {
  get: (key: string) =>
    db.getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key])?.value ?? null,
  set: (key: string, value: string) =>
    db.runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?,?)', [key, value]),
};

export const chatCache = {
  read: <T>(key: string): T | null => {
    const row = db.getFirstSync<{ json: string }>('SELECT json FROM chat_cache WHERE key = ?', [key]);
    return row ? (JSON.parse(row.json) as T) : null;
  },
  write: (key: string, value: unknown) =>
    db.runSync('INSERT OR REPLACE INTO chat_cache (key, json, savedAt) VALUES (?,?,?)', [
      key,
      JSON.stringify(value),
      Date.now(),
    ]),
};

// --- sign out ---

export function resetAll() {
  db.withTransactionSync(() => {
    for (const t of ['courses', 'lectures', 'assignments', 'exams', 'alarms', 'outbox', 'meta', 'chat_cache'])
      db.runSync(`DELETE FROM ${t}`);
  });

  notifyChange();
}
