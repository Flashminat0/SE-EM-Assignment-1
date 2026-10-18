import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { CoursePicker } from '@/components/CoursePicker';
import { DateTimeField } from '@/components/DateTimeField';
import { Field } from '@/components/Field';
import { T } from '@/components/Text';
import { WeekStrip } from '@/components/WeekStrip';
import { all, get, put } from '@/db';
import { newId } from '@/lib/id';
import { deleteItem, setLectureReminder } from '@/lib/notifications';
import { LAST_MINUTE, LECTURE_REMIND_MIN, lectureEndError } from '@/lib/reminders';
import { space, useColors } from '@/theme';
import { Form, param } from '@/components/Form';

const toMs = (min: number) => {
  const d = new Date();
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d.getTime();
};
const toMin = (ms: number) => {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
};
const endFor = (start: number, minutes: number) => Math.min(start + minutes, LAST_MINUTE);

export default function EditLecture() {
  const c = useColors();
  const p = useLocalSearchParams<{ id?: string; weekday?: string; startMin?: string }>();
  const id = param(p.id);
  const existing = id ? get('lectures', id) : null;
  const [rowId] = useState(() => existing?.id ?? newId());
  const [courseId, setCourseId] = useState(existing?.courseId ?? all('courses')[0]?.id ?? '');
  const [weekday, setWeekday] = useState(existing?.weekday ?? Number(param(p.weekday) ?? new Date().getDay()));
  const [startMin, setStart] = useState(existing?.startMin ?? Number(param(p.startMin) ?? 540));
  const [endMin, setEnd] = useState(existing?.endMin ?? endFor(startMin, 120));
  const [room, setRoom] = useState(existing?.room ?? '');
  const [remind, setRemind] = useState(!!existing?.remind);
  const endError = lectureEndError(startMin, endMin);

  const save = () =>
    setLectureReminder(
      put('lectures', { id: rowId, courseId, weekday, startMin, endMin, room: room.trim(), remind: remind ? 1 : 0 }),
    );
  const del = async () => {
    if (existing) await deleteItem('lecture', existing.id);
  };

  return (
    <Form
      title={existing ? 'Edit lecture' : 'New lecture'}
      canSave={!!courseId && !endError}
      onSave={save}
      onDelete={existing ? del : undefined}
      deleteHint="Lectures repeat every week. Delete it when the semester is over or the lecture has moved."
    >
      <CoursePicker value={courseId} onChange={setCourseId} />
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          Day
        </T>
        <WeekStrip value={weekday} onChange={setWeekday} />
      </View>
      <DateTimeField
        label="Starts"
        mode="time"
        value={toMs(startMin)}
        onChange={(ms) => {
          const m = toMin(ms);
          setStart(m);
          if (endMin <= m) setEnd(endFor(m, 60));
        }}
      />
      <View style={{ gap: space[2] }}>
        <DateTimeField label="Ends" mode="time" value={toMs(endMin)} onChange={(ms) => setEnd(toMin(ms))} />
        {endError ? (
          <T role="footnote" tone="overdue" accessibilityLiveRegion="polite">
            {endError}
          </T>
        ) : null}
      </View>
      <Field label="Room" value={room} onChangeText={setRoom} placeholder="Optional" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <T>Remind me {LECTURE_REMIND_MIN} minutes before</T>
          <T role="footnote" tone="secondary">
            Repeats every week
          </T>
        </View>
        <Switch
          value={remind}
          onValueChange={setRemind}
          trackColor={{ true: c.accent }}
          accessibilityLabel="Remind me before this lecture"
        />
      </View>
    </Form>
  );
}
