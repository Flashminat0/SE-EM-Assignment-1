import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/Button';
import { CoursePicker } from '@/components/CoursePicker';
import { DateTimeField } from '@/components/DateTimeField';
import { Field } from '@/components/Field';
import { ReminderChips } from '@/components/ReminderChips';
import { T } from '@/components/Text';
import { all, get, put } from '@/db';
import { newId } from '@/lib/id';
import { deleteItem, reminderOffsets, setAssignmentDone, setReminders } from '@/lib/notifications';
import { deletePhoto, keepPhoto, localPhotoUri, takePendingPhoto } from '@/lib/photo';
import { defaultOffsets } from '@/lib/reminders';
import { useNow } from '@/lib/useNow';
import { radius, space } from '@/theme';
import { Form, param } from '@/components/Form';

const tomorrow5pm = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return d.getTime();
};

export default function EditAssignment() {
  const router = useRouter();
  const now = useNow();
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const existing = id ? get('assignments', id) : null;
  const [rowId] = useState(() => existing?.id ?? newId());
  const [courseId, setCourseId] = useState(existing?.courseId ?? all('courses')[0]?.id ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [dueAt, setDueAt] = useState(existing?.dueAt ?? tomorrow5pm());
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [photo, setPhoto] = useState<string | null>(null);
  const [reminders, setRemindersState] = useState<number[]>(() =>
    existing ? reminderOffsets('assignment', existing.id, existing.dueAt) : defaultOffsets(dueAt, Date.now()),
  );

  useFocusEffect(
    useCallback(() => {
      const p = takePendingPhoto('assignment');
      if (p) setPhoto(p);
    }, []),
  );
  const shown = photo ?? (existing?.imageUri ? localPhotoUri(existing.imageUri) : null);

  const save = async () => {
    const kept = photo ? keepPhoto(photo, rowId) : null;
    put('assignments', {
      id: rowId,
      courseId,
      title: title.trim(),
      dueAt,
      notes: notes.trim(),
      done: existing?.done ?? 0,
      imageUri: kept ?? existing?.imageUri ?? null,
    });
    if (kept && existing?.imageUri) deletePhoto(existing.imageUri);
    const course = get('courses', courseId);
    await setReminders('assignment', rowId, dueAt, reminders, `${course?.code ?? ''} ${title.trim()}`.trim());
  };
  const del = async () => {
    if (existing) await deleteItem('assignment', existing.id);
  };
  const capture = () => router.push({ pathname: '/capture', params: { for: 'assignment' } });

  return (
    <Form
      title={existing ? 'Edit assignment' : 'New assignment'}
      canSave={!!courseId && title.trim().length > 0}
      onSave={save}
      onDelete={existing ? del : undefined}
      deleteHint="Finished it? Use Mark as done instead; done assignments are kept."
      action={
        existing
          ? {
              label: existing.done ? 'Reopen' : 'Mark as done',
              onPress: () => setAssignmentDone(existing, !existing.done),
            }
          : undefined
      }
    >
      <CoursePicker value={courseId} onChange={setCourseId} />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Assignment 1 report" />
      <DateTimeField label="Due" value={dueAt} onChange={setDueAt} />
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          Remind me
        </T>
        <ReminderChips value={reminders} at={dueAt} now={now} onChange={setRemindersState} />
      </View>
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Marking scheme, word count, submission link…"
        multiline
        style={{ minHeight: 88, textAlignVertical: 'top' }}
      />
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          Brief photo
        </T>
        {shown ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Retake photo" onPress={capture}>
            <Image
              source={{ uri: shown }}
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md }}
              contentFit="cover"
            />
          </Pressable>
        ) : null}
        <Button label={shown ? 'Retake photo' : 'Photograph the brief'} kind="secondary" onPress={capture} />
      </View>
    </Form>
  );
}
