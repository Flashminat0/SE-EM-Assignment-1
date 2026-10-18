import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { dateOfWeekday, weekdays } from '@/lib/format';
import { hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

export function WeekStrip({
  value,
  counts,
  today = new Date().getDay(),
  startOnMonday = true,
  anchor,
  onChange,
}: {
  value: number;
  counts?: number[];
  today?: number;
  startOnMonday?: boolean;
  anchor?: number;
  onChange: (weekday: number) => void;
}) {
  const c = useColors();
  const order = startOnMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return (
    <View style={s.row} accessibilityRole="tablist">
      {order.map((d) => {
        const on = d === value;
        const dateNum = anchor === undefined ? null : new Date(dateOfWeekday(anchor, d)).getDate();
        return (
          <Pressable
            key={d}
            accessibilityRole="tab"
            accessibilityLabel={dateNum === null ? weekdays[d] : `${weekdays[d]} ${dateNum}`}
            accessibilityState={{ selected: on }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(d);
            }}
            style={({ pressed }) => [
              s.day,
              { backgroundColor: on ? c.accent : 'transparent', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <T role="caption" tone={on ? 'onAccent' : d === today ? 'accent' : 'secondary'}>
              {weekdays[d]}
            </T>
            {dateNum !== null ? (
              <T role="headline" tone={on ? 'onAccent' : d === today ? 'accent' : 'primary'}>
                {dateNum}
              </T>
            ) : null}
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                marginTop: space[1],
                backgroundColor: (counts?.[d] ?? 0) > 0 ? (on ? c.onAccent : c.accent) : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[1] },
  day: {
    flex: 1,
    minHeight: hit,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[2],
  },
});
