import type { Assignment, Course, Exam, Lecture } from '@/db/schema';
import { dateOfWeekday, fmtMin, fmtTime } from './format';

export type TimelineItem = {
  id: string;
  kind: 'lecture' | 'assignment' | 'exam';
  startMin: number;
  endMin: number;
  title: string;
  code: string;
  colour: number;
  detail: string;
  done?: boolean;
};

type Data = {
  lectures: Lecture[];
  assignments: Assignment[];
  exams: Exam[];
  courses: Record<string, Course>;
};

const DAY = 86_400_000;
const minuteOf = (ms: number) => {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
};

export function timelineItems(anchor: number, weekday: number, data: Data): TimelineItem[] {
  const { courses } = data;
  const dayStart = dateOfWeekday(anchor, weekday);
  const onDay = (ms: number) => ms >= dayStart && ms < dayStart + DAY;
  const tag = (courseId: string) => ({ code: courses[courseId]?.code ?? '', colour: courses[courseId]?.colour ?? 0 });
  return [
    ...data.lectures
      .filter((l) => l.weekday === weekday)
      .map((l): TimelineItem => ({
        id: l.id,
        kind: 'lecture',
        startMin: l.startMin,
        endMin: l.endMin,
        title: courses[l.courseId]?.name ?? 'Lecture',
        detail: `${fmtMin(l.startMin)} – ${fmtMin(l.endMin)}${l.room ? ` · ${l.room}` : ''}`,
        ...tag(l.courseId),
      })),
    ...data.assignments
      .filter((a) => onDay(a.dueAt))
      .map((a): TimelineItem => ({
        id: a.id,
        kind: 'assignment',
        startMin: minuteOf(a.dueAt),
        endMin: minuteOf(a.dueAt) + 30,
        title: a.title,
        detail: `Due ${fmtTime(a.dueAt)}`,
        done: !!a.done,
        ...tag(a.courseId),
      })),
    ...data.exams
      .filter((e) => onDay(e.startsAt))
      .map((e): TimelineItem => ({
        id: e.id,
        kind: 'exam',
        startMin: minuteOf(e.startsAt),
        endMin: minuteOf(e.startsAt) + 120,
        title: e.title,
        detail: `${fmtTime(e.startsAt)}${e.venue ? ` · ${e.venue}` : ''}`,
        ...tag(e.courseId),
      })),
  ].sort((a, b) => a.startMin - b.startMin);
}

export function daySummary(items: TimelineItem[]) {
  const count = (kind: TimelineItem['kind'], word: string) => {
    const n = items.filter((i) => i.kind === kind).length;
    return n ? `${n} ${word}${n > 1 ? 's' : ''}` : '';
  };
  return (
    [count('lecture', 'lecture'), count('assignment', 'deadline'), count('exam', 'exam')].filter(Boolean).join(', ') ||
    'free'
  );
}
