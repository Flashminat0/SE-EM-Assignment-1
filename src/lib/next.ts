import type { Assignment, Course, Exam, Lecture } from '@/db/schema';
import { fmtDate, fmtMin, fmtTime, nextOccurrence } from './format';

export type Next = {
  kind: 'lecture' | 'assignment' | 'exam';
  from: number;
  at: number;
  title: string;
  course?: Course;
  sub: string;
  href: string;
};

type Data = { lectures: Lecture[]; assignments: Assignment[]; exams: Exam[]; courses: Record<string, Course> };

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

export function nextUp(now: number, { lectures, assignments, exams, courses }: Data): Next[] {
  const all: Next[] = [
    ...lectures.map((l) => ({
      kind: 'lecture' as const,
      from: 0,
      at: nextOccurrence(l.weekday, l.startMin, now),
      title: courses[l.courseId]?.name ?? 'Lecture',
      course: courses[l.courseId],
      sub: `${fmtMin(l.startMin)}${l.room ? ` · ${l.room}` : ''}`,
      href: `/edit/lecture?id=${l.id}`,
    })),
    ...assignments.map((a) => ({
      kind: 'assignment' as const,
      from: a.createdAt || a.dueAt - WEEK,
      at: a.dueAt,
      title: a.title,
      course: courses[a.courseId],
      sub: `Due ${fmtDate(a.dueAt)} · ${fmtTime(a.dueAt)}`,
      href: `/edit/assignment?id=${a.id}`,
    })),
    ...exams.map((e) => ({
      kind: 'exam' as const,
      from: e.createdAt || e.startsAt - WEEK,
      at: e.startsAt,
      title: e.title,
      course: courses[e.courseId],
      sub: `Exam ${fmtDate(e.startsAt)} · ${fmtTime(e.startsAt)}`,
      href: `/edit/exam?id=${e.id}`,
    })),
  ];
  const sorted = all.sort((a, b) => a.at - b.at);
  return sorted.filter((n) => sameDay(n.at, sorted[0].at));
}

export const ringProgress = (n: Next, now: number) => Math.min(1, Math.max(0.03, (now - n.from) / (n.at - n.from)));
