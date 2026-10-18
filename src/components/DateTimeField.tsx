import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { fmtDate, fmtDateTime, fmtTime } from '@/lib/format';
import { hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
}: {
  label: string;
  value: number;
  onChange: (ms: number) => void;
  mode?: 'datetime' | 'time' | 'date';
}) {
  const c = useColors();
  if (Platform.OS === 'android') {
    const open = () => {
      const pick = (m: 'date' | 'time', base: Date, next?: (d: Date) => void) =>
        DateTimePickerAndroid.open({
          value: base,
          mode: m,
          onDismiss: () => {},
          onValueChange: (_, d) => {
            if (next) next(d);
            else onChange(d.getTime());
          },
        });
      if (mode === 'datetime') pick('date', new Date(value), (d) => pick('time', d));
      else pick(mode, new Date(value));
    };
    const shown = mode === 'time' ? fmtTime(value) : mode === 'date' ? fmtDate(value) : fmtDateTime(value);
    return (
      <View style={{ gap: space[2] }}>
        <T role="footnote" tone="secondary">
          {label}
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={open}
          style={[s.box, { backgroundColor: c.elevated, borderColor: c.borderSubtle }]}
        >
          <T>{shown}</T>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[s.row, { borderColor: c.borderSubtle, backgroundColor: c.elevated }]}>
      <T style={{ flex: 1 }}>{label}</T>
      <DateTimePicker
        value={new Date(value)}
        mode={mode}
        display="compact"
        onValueChange={(_, d) => onChange(d.getTime())}
        accentColor={c.accent}
      />
    </View>
  );
}
const s = StyleSheet.create({
  box: {
    minHeight: hit + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    justifyContent: 'center',
  },
  row: {
    minHeight: hit + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    flexDirection: 'row',
    alignItems: 'center',
  },
});
