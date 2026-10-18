import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Button } from '@/components/Button';
import { DayTimeline } from '@/components/DayTimeline';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { WeekStrip } from '@/components/WeekStrip';
import { all, useCourses, useQuery } from '@/db';
import { dateOfWeekday, weekdaysLong } from '@/lib/format';
import { daySummary, timelineItems, type TimelineItem } from '@/lib/timeline';
import { useNow } from '@/lib/useNow';
import { space, useColors } from '@/theme';

const WEEK = 7 * 86_400_000;
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Timetable() {
  const c = useColors();
  const router = useRouter();
  const now = useNow();
  const clock = new Date(now);
  const today = clock.getDay();
  const nowMin = clock.getHours() * 60 + clock.getMinutes();
  const [day, setDay] = useState(today);
  const [anchor, setAnchor] = useState(now);
  const thisWeek = dateOfWeekday(anchor, 1) === dateOfWeekday(now, 1);
  const courses = useCourses();
  const lectures = useQuery(() => all('lectures', '1=1', [], 'startMin ASC'));
  const from = dateOfWeekday(anchor, 1),
    to = from + WEEK;
  const assignments = useQuery(() => all('assignments', 'dueAt >= ? AND dueAt < ?', [from, to]), [from]);
  const exams = useQuery(() => all('exams', 'startsAt >= ? AND startsAt < ?', [from, to]), [from]);

  const itemsOn = (d: number) => timelineItems(anchor, d, { lectures, assignments, exams, courses });
  const counts = Array.from({ length: 7 }, (_, d) => itemsOn(d).length);
  const items = itemsOn(day);
  const add = (startMin?: number) =>
    router.push({
      pathname: '/edit/lecture',
      params: { weekday: String(day), ...(startMin !== undefined ? { startMin: String(startMin) } : {}) },
    });
  const open = (i: TimelineItem) => router.push({ pathname: `/edit/${i.kind}`, params: { id: i.id } });
  // Fling left: next week. Right: previous.
  const swipe = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .runOnJS(true)
      .onEnd(() => setAnchor((a) => a + WEEK)),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .runOnJS(true)
      .onEnd(() => setAnchor((a) => a - WEEK)),
  );
  const summary = daySummary(items);

  return (
    <Screen
      title="Timetable"
      scroll={false}
      right={
        <IconButton
          sf="plus.circle.fill"
          android="add_circle"
          size={28}
          label="Add lecture"
          color={c.accent}
          onPress={() => add()}
        />
      }
    >
      <GestureDetector gesture={swipe}>
        <View>
          <WeekStrip value={day} counts={counts} today={thisWeek ? today : -1} anchor={anchor} onChange={setDay} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: space[2],
              marginTop: space[5],
              marginBottom: space[3],
            }}
          >
            <T role="title2">{weekdaysLong[day]}</T>
            <T role="footnote" tone="secondary">
              {shortDate(dateOfWeekday(anchor, day))}
            </T>
            <T role="footnote" tone="tertiary" style={{ flex: 1 }} numberOfLines={1}>
              {summary}
            </T>
            {!thisWeek ? (
              <Button
                label="This week"
                kind="ghost"
                onPress={() => setAnchor(now)}
                style={{ minHeight: 0, paddingHorizontal: 0 }}
              />
            ) : null}
          </View>
        </View>
      </GestureDetector>
      {lectures.length + assignments.length + exams.length === 0 ? (
        <EmptyState
          text="Nothing this week. Lectures, assignment deadlines and exams all show up here."
          action="Add a lecture"
          onAction={() => add()}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: space[12] }} showsVerticalScrollIndicator={false}>
          <DayTimeline
            items={items}
            nowMin={thisWeek && day === today ? nowMin : undefined}
            onPressItem={open}
            onPressSlot={add}
          />
        </ScrollView>
      )}
    </Screen>
  );
}
