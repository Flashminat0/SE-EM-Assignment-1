import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CoursePicker } from '@/components/CoursePicker';
import { DateTimeField } from '@/components/DateTimeField';
import { Field } from '@/components/Field';
import { ReminderChips } from '@/components/ReminderChips';
import { T } from '@/components/Text';
import { all, get, put } from '@/db';
import { newId } from '@/lib/id';
import { deleteItem, reminderOffsets, setReminders } from '@/lib/notifications';
import { defaultOffsets } from '@/lib/reminders';
import { useNow } from '@/lib/useNow';
import { space } from '@/theme';
import { Form, param } from '@/components/Form';

const nextWeek9am = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
};

export default function EditExam() {
  const now = useNow();
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const existing = id ? get('exams', id) : null;
  const [rowId] = useState(() => existing?.id ?? newId());
  const [courseId, setCourseId] = useState(existing?.courseId ?? all('courses')[0]?.id ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [startsAt, setStartsAt] = useState(existing?.startsAt ?? nextWeek9am());
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [reminders, setRemindersState] = useState<number[]>(() =>
    existing
      ? reminderOffsets('exam', existing.id, existing.startsAt)
      : defaultOffsets(startsAt, Date.now(), [24 * 60, 7 * 24 * 60]),
  );

  const save = async () => {
    put('exams', {
      id: rowId,
      courseId,
      title: title.trim(),
      startsAt,
      venue: venue.trim(),
      notes: notes.trim(),
      createdAt: existing?.createdAt || Date.now(),
    });
    const course = get('courses', courseId);
    await setReminders('exam', rowId, startsAt, reminders, `${course?.code ?? ''} ${title.trim()}`.trim());
  };
  const del = async () => {
    if (existing) await deleteItem('exam', existing.id);
  };

  return (
    <Form
      title={existing ? 'Edit exam' : 'New exam'}
      canSave={!!courseId && title.trim().length > 0}
      onSave={save}
      onDelete={existing ? del : undefined}
    >
      <CoursePicker value={courseId} onChange={setCourseId} />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Final exam" />
      <DateTimeField label="Starts" value={startsAt} onChange={setStartsAt} />
      <Field label="Venue" value={venue} onChangeText={setVenue} placeholder="Optional" />
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          Remind me
        </T>
        <ReminderChips value={reminders} at={startsAt} now={now} onChange={setRemindersState} />
      </View>
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Allowed materials, chapters…"
        multiline
        style={{ minHeight: 88, textAlignVertical: 'top' }}
      />
    </Form>
  );
}
