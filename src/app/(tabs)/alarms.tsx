import { useRouter, type Href } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { PendingMark } from '@/components/PendingMark';
import { Screen } from '@/components/Screen';
import { SwipeRow } from '@/components/SwipeRow';
import { T } from '@/components/Text';
import { all, get, usePendingIds, useQuery } from '@/db';
import { upcomingAlarm, type Alarm } from '@/db/schema';
import { fmtDateTime, fmtTime, relative, weekdaysLong } from '@/lib/format';
import { createAlarm, dismissAlarm } from '@/lib/notifications';
import { useNow } from '@/lib/useNow';
import { space, useColors } from '@/theme';

function itemHref(a: Alarm): Href | null {
  if (a.targetType === 'assignment' && get('assignments', a.targetId))
    return { pathname: '/edit/assignment', params: { id: a.targetId } };
  if (a.targetType === 'exam' && get('exams', a.targetId))
    return { pathname: '/edit/exam', params: { id: a.targetId } };
  if (a.targetType === 'lecture' && get('lectures', a.targetId))
    return { pathname: '/edit/lecture', params: { id: a.targetId } };
  return null;
}

export default function Alarms() {
  const c = useColors();
  const router = useRouter();
  const now = useNow();
  const rows = useQuery(
    () => all('alarms', upcomingAlarm, [now], 'fireAt ASC').map((a) => ({ a, href: itemHref(a) })),
    [now],
  );
  const pending = usePendingIds('alarms');
  const test = () =>
    void createAlarm({
      targetType: 'assignment',
      targetId: 'test',
      fireAt: Date.now() + 10_000,
      label: 'Test alarm',
      weekly: 0,
    });

  return (
    <Screen title="Alarms" scroll={false}>
      <T tone="secondary" style={{ marginTop: -space[2] }}>
        Alarms ring on this device even with no internet.
      </T>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.a.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: space[3], paddingTop: space[5], paddingBottom: space[12] }}
        renderItem={({ item: { a, href } }) => (
          <SwipeRow onDelete={() => void dismissAlarm(a.id)}>
            <Card
              onPress={href ? () => router.push(href) : undefined}
              accessibilityHint={href ? `Opens the ${a.targetType}` : undefined}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}
            >
              <Icon sf={a.weekly ? 'repeat' : 'alarm'} android={a.weekly ? 'repeat' : 'alarm'} color={c.accent} />
              <View style={{ flex: 1, gap: space[1] }}>
                <T role="headline" numberOfLines={2}>
                  {a.label}
                </T>
                <T role="footnote" tone="secondary">
                  {a.weekly
                    ? `Every ${weekdaysLong[new Date(a.fireAt).getDay()]} · ${fmtTime(a.fireAt)}`
                    : fmtDateTime(a.fireAt)}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end', gap: space[1] }}>
                <T role="footnote" tone="secondary">
                  {a.weekly ? 'weekly' : relative(a.fireAt, now)}
                </T>
                <PendingMark pending={pending.has(a.id)} />
              </View>
            </Card>
          </SwipeRow>
        )}
        ListEmptyComponent={
          <EmptyState
            text="No alarms set. Reminders you choose on assignments, exams and lectures appear here."
            action="Ring a test alarm in 10 s"
            onAction={test}
          />
        }
        ListFooterComponent={
          rows.length ? <Button label="Ring a test alarm in 10 s" kind="ghost" onPress={test} /> : null
        }
      />
    </Screen>
  );
}
