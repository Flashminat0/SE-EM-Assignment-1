import { View } from 'react-native';
import type { Course, Lecture } from '@/db/schema';
import { fmtMin } from '@/lib/format';
import { courseColours, space } from '@/theme';
import { Card } from './Card';
import { T } from './Text';

type Props = { l: Lecture; course?: Course; nowMin?: number; onPress: () => void };

export function LectureRow({ l, course, nowMin, onPress }: Props) {
  const over = nowMin !== undefined && nowMin >= l.endMin;
  const live = nowMin !== undefined && nowMin >= l.startMin && !over;
  return (
    <Card
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], opacity: over ? 0.45 : 1 }}
    >
      <View
        style={{
          width: 4,
          alignSelf: 'stretch',
          borderRadius: 2,
          backgroundColor: courseColours[(course?.colour ?? 0) % 8],
        }}
      />
      <View style={{ flex: 1 }}>
        <T role="headline">{course?.name ?? 'Lecture'}</T>
        <T role="footnote" tone="secondary">
          {fmtMin(l.startMin)} – {fmtMin(l.endMin)}
          {l.room ? ` · ${l.room}` : ''}
        </T>
      </View>
      {live ? (
        <T role="caption" tone="accent">
          Now
        </T>
      ) : over ? (
        <T role="caption" tone="tertiary">
          Done
        </T>
      ) : null}
    </Card>
  );
}
