import { View } from 'react-native';
import { courseLabel } from '@/lib/format';
import { courseColours, courseFill, radius, space } from '@/theme';
import { T } from './Text';

export function CourseTag({ code, name, colour }: { code: string; name: string; colour: number }) {
  const tint = courseColours[colour % courseColours.length];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[2],
        backgroundColor: tint + courseFill.tag,
        borderRadius: radius.pill,
        paddingHorizontal: space[3],
        paddingVertical: space[1],
        alignSelf: 'flex-start',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tint }} />
      <T role="caption" tone="secondary">
        {courseLabel(code, name)}
      </T>
    </View>
  );
}
