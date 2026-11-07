import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Assignment, Course } from '@/db/schema';
import { fmtDate, fmtTime, relative } from '@/lib/format';
import { setAssignmentDone } from '@/lib/notifications';
import { space, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { CourseTag } from '@/components/controls/CourseTag';
import { DoneCircle } from '@/components/controls/DoneCircle';
import { Icon } from '@/components/ui/Icon';
import { PendingMark } from '@/components/ui/PendingMark';
import { T } from '@/components/ui/Text';

type Props = { a: Assignment; course?: Course; now: number; pending?: boolean };

export function AssignmentRow({ a, course, now, pending }: Props) {
  const c = useColors();
  const router = useRouter();

  const done = !!a.done;
  const status = done ? 'done' : relative(a.dueAt, now);

  return (
    <Card
      onPress={() => router.push({ pathname: '/edit/assignment', params: { id: a.id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], opacity: done ? 0.7 : 1 }}
    >
      {/* Tick here does the same as the swipe, for people who prefer a tap */}
      <DoneCircle done={done} onChange={(d) => void setAssignmentDone(a, d)} />
      <View style={{ flex: 1, gap: space[1] }}>
        <T role="headline" numberOfLines={2} style={done ? { textDecorationLine: 'line-through' } : undefined}>
          {a.title}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[2] }}>
          {course ? <CourseTag code={course.code} name={course.name} colour={course.colour} /> : null}
          <T role="footnote" tone="secondary">
            {fmtDate(a.dueAt)} · {fmtTime(a.dueAt)}
          </T>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: space[1] }}>
        <T role="footnote" tone={done ? 'done' : a.dueAt < now ? 'overdue' : 'secondary'}>
          {status}
        </T>
        <View style={{ flexDirection: 'row', gap: space[1] }}>
          {a.imageUri ? (
            <Icon
              sf="paperclip"
              android="attach_file"
              size={16}
              color={c.textTertiary}
              accessibilityLabel="Has a photo"
            />
          ) : null}
          <PendingMark pending={!!pending} />
        </View>
      </View>
    </Card>
  );
}
