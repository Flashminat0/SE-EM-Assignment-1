import { View } from 'react-native';
import type { Course, Lecture } from '@/db/schema';
import { fmtMin } from '@/lib/format';
import { courseColours, space } from '@/theme';
import { Card } from './Card';
import { T } from './Text';

export function LectureRow({ l, course, onPress }: { l: Lecture; course?: Course; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
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
    </Card>
  );
}
