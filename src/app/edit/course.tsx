import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ColourPicker } from '@/components/ColourPicker';
import { Field } from '@/components/Field';
import { T } from '@/components/Text';
import { all, get, put, remove } from '@/db';
import { newId } from '@/lib/id';
import { deleteItem } from '@/lib/notifications';
import { space } from '@/theme';
import { Form, param } from '@/components/Form';

export default function EditCourse() {
  const id = param(useLocalSearchParams<{ id?: string }>().id);
  const existing = id ? get('courses', id) : null;
  const [rowId] = useState(() => existing?.id ?? newId());
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [lecturerName, setLecturer] = useState(existing?.lecturerName ?? '');
  const [colour, setColour] = useState(existing?.colour ?? all('courses').length % 8);

  const save = () =>
    put('courses', {
      id: rowId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      lecturerName: lecturerName.trim(),
      colour,
    });
  const del = async () => {
    if (!existing) return;
    for (const l of all('lectures', 'courseId = ?', [existing.id])) await deleteItem('lecture', l.id);
    for (const a of all('assignments', 'courseId = ?', [existing.id])) await deleteItem('assignment', a.id);
    for (const e of all('exams', 'courseId = ?', [existing.id])) await deleteItem('exam', e.id);
    remove('courses', existing.id);
  };

  return (
    <Form
      title={existing ? 'Edit course' : 'New course'}
      canSave={code.trim().length > 0 && name.trim().length > 0}
      onSave={save}
      onDelete={existing ? del : undefined}
      deleteLabel="Delete course and its items"
    >
      <Field
        label="Course code"
        value={code}
        onChangeText={setCode}
        placeholder="SE5070"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Field label="Course name" value={name} onChangeText={setName} placeholder="Enterprise Mobility" />
      <Field label="Lecturer" value={lecturerName} onChangeText={setLecturer} placeholder="Optional" />
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          Colour
        </T>
        <ColourPicker value={colour} onChange={setColour} />
      </View>
    </Form>
  );
}
