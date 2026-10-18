export type Base = { id: string; updatedAt: number; deletedAt: number | null };

export type Course = Base & { code: string; name: string; colour: number; lecturerName: string };
export type Lecture = Base & {
  courseId: string;
  weekday: number;
  startMin: number;
  endMin: number;
  room: string;
  remind: number;
};
export type Assignment = Base & {
  courseId: string;
  title: string;
  dueAt: number;
  notes: string;
  done: number;
  imageUri: string | null;
  createdAt: number;
};
export type Exam = Base & {
  courseId: string;
  title: string;
  startsAt: number;
  venue: string;
  notes: string;
  createdAt: number;
};
export type Alarm = Base & {
  targetType: 'assignment' | 'exam' | 'lecture';
  targetId: string;
  fireAt: number;
  label: string;
  weekly: number;
};

export type Tables = {
  courses: Course;
  lectures: Lecture;
  assignments: Assignment;
  exams: Exam;
  alarms: Alarm;
};
export type TableName = keyof Tables;
export const tableNames: TableName[] = ['courses', 'lectures', 'assignments', 'exams', 'alarms'];

export const localOnly: Record<TableName, string[]> = {
  courses: [],
  lectures: [],
  assignments: ['imageUri'],
  exams: [],
  alarms: [],
};

export const selectLive = (table: TableName, where = '1=1', order = 'updatedAt DESC') =>
  `SELECT * FROM ${table} WHERE deletedAt IS NULL AND (${where}) ORDER BY ${order}`;

export const activeAlarm = `NOT EXISTS (SELECT 1 FROM assignments t WHERE alarms.targetType = 'assignment' AND t.id = alarms.targetId AND (t.deletedAt IS NOT NULL OR t.done = 1))
  AND NOT EXISTS (SELECT 1 FROM exams t WHERE alarms.targetType = 'exam' AND t.id = alarms.targetId AND t.deletedAt IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM lectures t WHERE alarms.targetType = 'lecture' AND t.id = alarms.targetId AND t.deletedAt IS NOT NULL)`;
export const upcomingAlarm = `${activeAlarm} AND (weekly = 1 OR fireAt > ?)`;

export const DDL = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, colour INTEGER NOT NULL DEFAULT 0,
  lecturerName TEXT NOT NULL DEFAULT '', updatedAt INTEGER NOT NULL, deletedAt INTEGER
);
CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY, courseId TEXT NOT NULL, weekday INTEGER NOT NULL, startMin INTEGER NOT NULL,
  endMin INTEGER NOT NULL, room TEXT NOT NULL DEFAULT '', remind INTEGER NOT NULL DEFAULT 0,
  updatedAt INTEGER NOT NULL, deletedAt INTEGER
);
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY, courseId TEXT NOT NULL, title TEXT NOT NULL, dueAt INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '', done INTEGER NOT NULL DEFAULT 0, imageUri TEXT,
  createdAt INTEGER NOT NULL DEFAULT 0, updatedAt INTEGER NOT NULL, deletedAt INTEGER
);
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY, courseId TEXT NOT NULL, title TEXT NOT NULL, startsAt INTEGER NOT NULL,
  venue TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', createdAt INTEGER NOT NULL DEFAULT 0,
  updatedAt INTEGER NOT NULL, deletedAt INTEGER
);
CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY, targetType TEXT NOT NULL, targetId TEXT NOT NULL, fireAt INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT '', weekly INTEGER NOT NULL DEFAULT 0,
  updatedAt INTEGER NOT NULL, deletedAt INTEGER
);
CREATE TABLE IF NOT EXISTS outbox (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, rowId TEXT NOT NULL, queuedAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_cache (key TEXT PRIMARY KEY, json TEXT NOT NULL, savedAt INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_outbox_row ON outbox(tbl, rowId);
CREATE INDEX IF NOT EXISTS idx_alarms_fireAt ON alarms(fireAt);
CREATE INDEX IF NOT EXISTS idx_assignments_dueAt ON assignments(dueAt);
`;
