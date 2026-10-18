import { openDatabaseSync } from 'expo-sqlite';
import { useMemo, useSyncExternalStore } from 'react';
import { DDL, selectLive, type Base, type Course, type TableName, type Tables } from './schema';

export const db = openDatabaseSync('edu-alarm.db');
db.execSync(DDL);
for (const t of ['assignments', 'exams'])
  if (!db.getAllSync<{ name: string }>(`PRAGMA table_info(${t})`).some((c) => c.name === 'createdAt'))
    db.execSync(`ALTER TABLE ${t} ADD COLUMN createdAt INTEGER NOT NULL DEFAULT 0`);

let version = 0;
const listeners = new Set<() => void>();
export const notifyChange = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const writeListeners = new Set<() => void>();
export const onLocalWrite = (l: () => void) => {
  writeListeners.add(l);
  return () => {
    writeListeners.delete(l);
  };
};
const notifyWrite = () => writeListeners.forEach((l) => l());

export function useQuery<T>(query: () => T, deps: readonly (string | number | boolean | null | undefined)[] = []): T {
  const v = useSyncExternalStore(subscribe, getVersion, getVersion);
  const key = `${v}|${deps.join('|')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => query(), [key]);
}
const getVersion = () => version;

export const usePendingIds = (table: TableName) => useQuery(() => outbox.pendingIds(table), [table]);
export const useCourses = () =>
  useQuery(() => Object.fromEntries(all('courses').map((k) => [k.id, k])) as Record<string, Course>);

export function all<K extends TableName>(
  table: K,
  where = '1=1',
  params: (string | number)[] = [],
  order = 'updatedAt DESC',
): Tables[K][] {
  return db.getAllSync<Tables[K]>(selectLive(table, where, order), params);
}
export function get<K extends TableName>(table: K, id: string): Tables[K] | null {
  return db.getFirstSync<Tables[K]>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

const columns = new Map<TableName, Set<string>>();
function columnsOf(table: TableName) {
  let c = columns.get(table);
  if (!c) {
    c = new Set(db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`).map((r) => r.name));
    columns.set(table, c);
  }
  return c;
}

function writeRow<K extends TableName>(table: K, full: Tables[K], queue: boolean) {
  const cols = Object.keys(full).filter((k) => columnsOf(table).has(k));
  db.runSync(
    `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
    cols.map((c) => (full as Record<string, unknown>)[c] as string | number | null),
  );
  if (queue) db.runSync('INSERT INTO outbox (tbl, rowId, queuedAt) VALUES (?,?,?)', [table, full.id, Date.now()]);
}

export function put<K extends TableName>(
  table: K,
  row: Omit<Tables[K], 'updatedAt' | 'deletedAt'> & Partial<Base>,
): Tables[K] {
  const full = { ...row, updatedAt: Date.now(), deletedAt: row.deletedAt ?? null } as Tables[K];
  db.withTransactionSync(() => writeRow(table, full, true));
  notifyChange();
  notifyWrite();
  return full;
}

export function applyRemote<K extends TableName>(table: K, rows: Tables[K][]) {
  if (!rows.length) return;
  db.withTransactionSync(() => rows.forEach((r) => writeRow(table, r, false)));
  notifyChange();
}

export function remove(table: TableName, id: string) {
  db.withTransactionSync(() => {
    db.runSync(`UPDATE ${table} SET deletedAt = ?, updatedAt = ? WHERE id = ?`, [Date.now(), Date.now(), id]);
    db.runSync('INSERT INTO outbox (tbl, rowId, queuedAt) VALUES (?,?,?)', [table, id, Date.now()]);
  });
  notifyChange();
  notifyWrite();
}

export const meta = {
  get: (key: string) =>
    db.getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key])?.value ?? null,
  set: (key: string, value: string) =>
    db.runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?,?)', [key, value]),
};

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

export function resetAll() {
  db.withTransactionSync(() => {
    for (const t of ['courses', 'lectures', 'assignments', 'exams', 'alarms', 'outbox', 'meta', 'chat_cache'])
      db.runSync(`DELETE FROM ${t}`);
  });
  notifyChange();
}
