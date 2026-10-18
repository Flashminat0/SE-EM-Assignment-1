import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AssignmentRow } from '@/components/AssignmentRow';
import { Card } from '@/components/Card';
import { CountdownRing } from '@/components/CountdownRing';
import { CourseTag } from '@/components/CourseTag';
import { EmptyState } from '@/components/EmptyState';
import { ExamRow } from '@/components/ExamRow';
import { IconButton } from '@/components/IconButton';
import { LectureRow } from '@/components/LectureRow';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { all, useCourses, useQuery } from '@/db';
import { fmtDate, relative } from '@/lib/format';
import { nextUp, ringProgress } from '@/lib/next';
import { useNow } from '@/lib/useNow';
import { courseColours, space, useColors } from '@/theme';

const DAY = 86_400_000;

export default function Today() {
  const c = useColors();
  const router = useRouter();
  const now = useNow();
  const today = new Date(now).getDay();
  const courses = useCourses();
  const lectures = useQuery(() => all('lectures', 'weekday = ?', [today], 'startMin ASC'), [today]);
  const due = useQuery(() => all('assignments', 'done = 0 AND dueAt >= ?', [now], 'dueAt ASC LIMIT 5'), [now]);
  const overdue = useQuery(
    () => all('assignments', 'done = 0 AND dueAt < ? AND dueAt > ?', [now, now - 30 * DAY], 'dueAt DESC LIMIT 3'),
    [now],
  );
  const exams = useQuery(() => all('exams', 'startsAt > ?', [now], 'startsAt ASC LIMIT 3'), [now]);
  const allLectures = useQuery(() => all('lectures'));

  const next = nextUp(now, { lectures: allLectures, assignments: due, exams, courses });
  const empty = Object.keys(courses).length === 0;
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen
      title={greeting}
      right={
        <IconButton
          sf="gearshape"
          android="settings"
          label="Settings"
          color={c.textSecondary}
          onPress={() => router.push('/settings')}
        />
      }
    >
      <T tone="secondary" style={{ marginTop: -space[3], marginBottom: space[5] }}>
        {fmtDate(now)}
      </T>

      {empty ? (
        <EmptyState
          text="Add your first course, then your lectures, assignments and exams will show up here."
          action="Add a course"
          onAction={() => router.push('/edit/course')}
        />
      ) : next ? (
        <Card
          onPress={() => router.push(next.href as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space[5], padding: space[5] }}
        >
          <CountdownRing
            progress={ringProgress(next.at, now)}
            size={112}
            colour={next.course ? courseColours[next.course.colour % 8] : undefined}
          >
            <T role="caption" tone="tertiary">
              {next.kind.toUpperCase()}
            </T>
            <T role="headline" style={{ textAlign: 'center' }}>
              {relative(next.at, now)}
            </T>
          </CountdownRing>
          <View style={{ flex: 1, gap: space[1] }}>
            <T role="caption" tone="tertiary">
              NEXT UP
            </T>
            <T role="title2" numberOfLines={2}>
              {next.title}
            </T>
            {next.course ? (
              <CourseTag code={next.course.code} name={next.course.name} colour={next.course.colour} />
            ) : null}
            <T role="footnote" tone="secondary">
              {next.sub}
            </T>
          </View>
        </Card>
      ) : (
        <EmptyState
          text="Nothing scheduled ahead. Add a lecture, assignment or exam."
          action="Add an assignment"
          onAction={() => router.push('/edit/assignment')}
        />
      )}

      {!empty ? (
        <>
          <Section title="Today's lectures">
            {lectures.length === 0 ? (
              <T tone="tertiary">No lectures today.</T>
            ) : (
              lectures.map((l) => (
                <LectureRow
                  key={l.id}
                  l={l}
                  course={courses[l.courseId]}
                  onPress={() => router.push(`/edit/lecture?id=${l.id}` as never)}
                />
              ))
            )}
          </Section>
          {overdue.length > 0 ? (
            <Section title="Overdue">
              {overdue.map((a) => (
                <AssignmentRow key={a.id} a={a} course={courses[a.courseId]} now={now} />
              ))}
            </Section>
          ) : null}
          <Section title="Due soon">
            {due.length === 0 ? (
              <T tone="tertiary">Nothing due. Enjoy it.</T>
            ) : (
              due.map((a) => <AssignmentRow key={a.id} a={a} course={courses[a.courseId]} now={now} />)
            )}
          </Section>
          {exams.length > 0 ? (
            <Section title="Upcoming exams">
              {exams.map((e) => (
                <ExamRow key={e.id} e={e} course={courses[e.courseId]} now={now} />
              ))}
            </Section>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space[6], gap: space[3] }}>
      <T role="title2">{title}</T>
      {children}
    </View>
  );
}
