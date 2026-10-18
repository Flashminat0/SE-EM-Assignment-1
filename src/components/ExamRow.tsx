import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Course, Exam } from '@/db/schema';
import { fmtDate, fmtTime, relative } from '@/lib/format';
import { space } from '@/theme';
import { Card } from './Card';
import { CourseTag } from './CourseTag';
import { PendingMark } from './PendingMark';
import { T } from './Text';

type Props = { e: Exam; course?: Course; now: number; pending?: boolean };

export function ExamRow({ e, course, now, pending }: Props) {
  const router = useRouter();
  const past = e.startsAt < now;
  return (
    <Card
      onPress={() => router.push({ pathname: '/edit/exam', params: { id: e.id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}
    >
      <View style={{ flex: 1, gap: space[1] }}>
        <T role="headline" numberOfLines={2}>
          {e.title}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[2] }}>
          {course ? <CourseTag code={course.code} name={course.name} colour={course.colour} /> : null}
          <T role="footnote" tone="secondary">
            {fmtDate(e.startsAt)} · {fmtTime(e.startsAt)}
            {e.venue ? ` · ${e.venue}` : ''}
          </T>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: space[1] }}>
        <T role="footnote" tone={past ? 'tertiary' : 'secondary'}>
          {past ? 'past' : relative(e.startsAt, now)}
        </T>
        <PendingMark pending={!!pending} />
      </View>
    </Card>
  );
}
