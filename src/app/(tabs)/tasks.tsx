import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable } from 'react-native';
import { AssignmentRow } from '@/components/AssignmentRow';
import { EmptyState } from '@/components/EmptyState';
import { ExamRow } from '@/components/ExamRow';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { SwipeRow } from '@/components/SwipeRow';
import { T } from '@/components/Text';
import { all, useCourses, usePendingIds, useQuery } from '@/db';
import type { Assignment, Exam } from '@/db/schema';
import { deleteItem, setAssignmentDone } from '@/lib/notifications';
import { useNow } from '@/lib/useNow';
import { hit, space, useColors } from '@/theme';

type Row =
  | { key: string; kind: 'assignment'; a: Assignment }
  | { key: string; kind: 'exam'; e: Exam }
  | { key: string; kind: 'toggle'; label: string; onPress: () => void };

const toggle = (key: string, shown: boolean, what: string, n: number, onPress: () => void): Row => ({
  key,
  kind: 'toggle',
  label: `${shown ? 'Hide' : 'Show'} ${what} (${n})`,
  onPress,
});

export default function Tasks() {
  const c = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<'assignments' | 'exams'>('assignments');
  const [showDone, setShowDone] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const now = useNow();
  const courses = useCourses();
  const open = useQuery(() => all('assignments', 'done = 0', [], 'dueAt ASC'));
  const done = useQuery(() => all('assignments', 'done = 1', [], 'updatedAt DESC'));
  const upcomingExams = useQuery(() => all('exams', 'startsAt >= ?', [now], 'startsAt ASC'), [now]);
  const pastExams = useQuery(() => all('exams', 'startsAt < ?', [now], 'startsAt DESC'), [now]);
  const pendingA = usePendingIds('assignments');
  const pendingE = usePendingIds('exams');

  const del = (table: 'assignments' | 'exams', id: string) =>
    Alert.alert(
      table === 'assignments' ? 'Delete this assignment?' : 'Delete this exam?',
      table === 'assignments'
        ? 'Finished it? Mark it done instead; done assignments are kept.'
        : 'It is removed from your list and its reminders are cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteItem(table === 'assignments' ? 'assignment' : 'exam', id),
        },
      ],
    );

  const assignment = (a: Assignment): Row => ({ key: a.id, kind: 'assignment', a });
  const exam = (e: Exam): Row => ({ key: e.id, kind: 'exam', e });
  const rows: Row[] =
    tab === 'exams'
      ? [
          ...upcomingExams.map(exam),
          ...(pastExams.length
            ? [toggle('past', showPast, 'past exams', pastExams.length, () => setShowPast((v) => !v))]
            : []),
          ...(showPast ? pastExams.map(exam) : []),
        ]
      : [
          ...open.map(assignment),
          ...(done.length ? [toggle('done', showDone, 'completed', done.length, () => setShowDone((v) => !v))] : []),
          ...(showDone ? done.map(assignment) : []),
        ];

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'toggle') {
      return (
        <Pressable
          accessibilityRole="button"
          onPress={item.onPress}
          style={{ minHeight: hit, justifyContent: 'center' }}
        >
          <T role="callout" tone="accent">
            {item.label}
          </T>
        </Pressable>
      );
    }
    if (item.kind === 'exam') {
      return (
        <SwipeRow onDelete={() => del('exams', item.e.id)}>
          <ExamRow e={item.e} course={courses[item.e.courseId]} now={now} pending={pendingE.has(item.e.id)} />
        </SwipeRow>
      );
    }
    const a = item.a;
    return (
      <SwipeRow
        onComplete={() => void setAssignmentDone(a, !a.done)}
        completeLabel={a.done ? 'Reopen' : 'Done'}
        onDelete={() => del('assignments', a.id)}
      >
        <AssignmentRow a={a} course={courses[a.courseId]} now={now} pending={pendingA.has(a.id)} />
      </SwipeRow>
    );
  };

  const addLabel = tab === 'assignments' ? 'Add assignment' : 'Add exam';
  const addHref = tab === 'assignments' ? '/edit/assignment' : '/edit/exam';
  return (
    <Screen
      title="Tasks"
      scroll={false}
      right={
        <IconButton
          sf="plus.circle.fill"
          android="add_circle"
          size={28}
          label={addLabel}
          color={c.accent}
          onPress={() => router.push(addHref)}
        />
      }
    >
      <Segmented
        options={[
          { key: 'assignments', label: 'Assignments' },
          { key: 'exams', label: 'Exams' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderRow}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: space[3], paddingTop: space[5], paddingBottom: space[12] }}
        ListHeaderComponent={
          tab === 'assignments' && open.length === 0 && done.length > 0 ? (
            <T tone="tertiary" style={{ textAlign: 'center', paddingVertical: space[6] }}>
              All caught up.
            </T>
          ) : null
        }
        ListEmptyComponent={
          tab === 'assignments' ? (
            <EmptyState
              text="No assignments yet. Add one and choose when to be reminded."
              action="Add an assignment"
              onAction={() => router.push('/edit/assignment')}
            />
          ) : (
            <EmptyState
              text="No exams yet. Add one to get a countdown and reminders."
              action="Add an exam"
              onAction={() => router.push('/edit/exam')}
            />
          )
        }
      />
    </Screen>
  );
}
