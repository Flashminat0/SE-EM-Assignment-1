import * as Notifications from 'expo-notifications';
import { all, get, put, remove } from '@/db';
import { activeAlarm, upcomingAlarm, type Alarm, type Assignment, type Lecture } from '@/db/schema';
import { nextOccurrence } from './format';
import { newId } from './id';
import { deletePhoto } from './photo';
import { LECTURE_REMIND_MIN, lectureReminderAt, offsetsFrom, reminderTimes, snoozedAlarm } from './reminders';

Notifications.setNotificationHandler({
  handleNotification: async (n) => ({
    shouldShowBanner: typeof n.request.content.data?.alarmId !== 'string',
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  return (await Notifications.getPermissionsAsync()).granted || (await Notifications.requestPermissionsAsync()).granted;
}

export const isActive = (id: string) => all('alarms', `id = ? AND ${activeAlarm}`, [id]).length > 0;

const body: Record<Alarm['targetType'], string> = {
  lecture: 'Lecture starting soon',
  exam: 'Exam reminder',
  assignment: 'Assignment reminder',
};

export async function schedule(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  const a = get('alarms', id);
  if (!a || !isActive(id) || (!a.weekly && a.fireAt <= Date.now())) return;
  const d = new Date(a.fireAt);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: a.label, body: body[a.targetType], sound: 'default', data: { alarmId: id } },
    trigger: a.weekly
      ? {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: d.getDay() + 1,
          hour: d.getHours(),
          minute: d.getMinutes(),
        }
      : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d },
  });
}

export async function scheduleAll() {
  for (const a of all('alarms', upcomingAlarm, [Date.now()])) await schedule(a.id);
}

export async function createAlarm(input: Omit<Alarm, 'id' | 'updatedAt' | 'deletedAt'>) {
  const row = put('alarms', { ...input, id: newId() });
  await schedule(row.id);
  return row;
}

export async function deleteAlarm(id: string) {
  remove('alarms', id);
  await schedule(id); // cancels, since the row is now deleted
}

export async function dismissAlarm(id: string) {
  const a = get('alarms', id);
  if (!a) return;
  await deleteAlarm(id);
  const l = a.weekly && a.targetType === 'lecture' ? get('lectures', a.targetId) : null;
  if (l && !l.deletedAt && l.remind) put('lectures', { ...l, remind: 0 });
}

export async function deleteAlarmsFor(targetType: Alarm['targetType'], targetId: string) {
  for (const a of all('alarms', 'targetType = ? AND targetId = ?', [targetType, targetId])) await deleteAlarm(a.id);
}

const tableOf = { lecture: 'lectures', assignment: 'assignments', exam: 'exams' } as const;

export async function deleteItem(kind: Alarm['targetType'], id: string) {
  await deleteAlarmsFor(kind, id);
  if (kind === 'assignment') deletePhoto(get('assignments', id)?.imageUri);
  remove(tableOf[kind], id);
}

export async function setReminders(
  targetType: 'assignment' | 'exam',
  targetId: string,
  at: number,
  offsets: number[],
  label: string,
) {
  await deleteAlarmsFor(targetType, targetId);
  for (const fireAt of reminderTimes(at, offsets))
    await createAlarm({ targetType, targetId, fireAt, label, weekly: 0 });
}

export async function setLectureReminder(l: Lecture) {
  await deleteAlarmsFor('lecture', l.id);
  if (!l.remind) return;
  const r = lectureReminderAt(l.weekday, l.startMin);
  await createAlarm({
    targetType: 'lecture',
    targetId: l.id,
    fireAt: nextOccurrence(r.weekday, r.minute),
    label: `${get('courses', l.courseId)?.code ?? 'Lecture'} starts in ${LECTURE_REMIND_MIN} min`,
    weekly: 1,
  });
}

export const reminderOffsets = (targetType: Alarm['targetType'], targetId: string, at: number) =>
  offsetsFrom(
    at,
    all('alarms', 'targetType = ? AND targetId = ? AND weekly = 0', [targetType, targetId]).map((a) => a.fireAt),
  );

export async function setAssignmentDone(a: Assignment, done: boolean) {
  put('assignments', { ...a, done: done ? 1 : 0 });
  for (const alarm of all('alarms', "targetType = 'assignment' AND targetId = ?", [a.id])) await schedule(alarm.id);
}

export async function snooze(id: string, minutes: number) {
  const a = get('alarms', id);
  if (!a || !isActive(id)) return false;
  const row = put('alarms', snoozedAlarm(a, minutes, Date.now(), newId));
  await schedule(row.id);
  return true;
}
