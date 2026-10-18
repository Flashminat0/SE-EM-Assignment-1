import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { reminderOptions, reminderPassed } from '@/lib/reminders';
import { hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

export { reminderOptions };

export function ReminderChips({
  value,
  at,
  now,
  options = reminderOptions,
  onChange,
}: {
  value: number[];
  at?: number;
  now?: number;
  options?: readonly { minutes: number; label: string }[];
  onChange: (minutes: number[]) => void;
}) {
  const c = useColors();
  const passed = (m: number) => at !== undefined && now !== undefined && reminderPassed(at, m, now);
  const toggle = (m: number) => {
    void Haptics.selectionAsync();
    onChange((value.includes(m) ? value.filter((v) => v !== m) : [...value, m]).sort((a, b) => a - b));
  };
  const anyPassed = options.some((o) => passed(o.minutes));
  const noneCanRing = value.length > 0 && value.every(passed);
  return (
    <View style={{ gap: space[2] }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
        {options.map((o) => {
          const on = value.includes(o.minutes);
          const gone = passed(o.minutes);
          return (
            <Pressable
              key={o.minutes}
              accessibilityRole="checkbox"
              accessibilityLabel={gone ? `${o.label}, time has passed` : o.label}
              accessibilityState={{ checked: on, disabled: gone }}
              disabled={gone && !on}
              onPress={() => toggle(o.minutes)}
              style={{
                minHeight: hit,
                paddingHorizontal: space[4],
                borderRadius: radius.pill,
                justifyContent: 'center',
                opacity: gone ? 0.5 : 1,
                backgroundColor: on && !gone ? c.accentSoft : c.elevated,
                borderWidth: 1,
                borderColor: on && !gone ? c.accent : c.borderSubtle,
              }}
            >
              <T
                role="callout"
                tone={on && !gone ? 'accent' : 'secondary'}
                style={gone && on ? { textDecorationLine: 'line-through' } : undefined}
              >
                {o.label}
              </T>
            </Pressable>
          );
        })}
      </View>
      {noneCanRing ? (
        <T role="footnote" tone="overdue">
          No reminder can ring: the times you picked have already passed.
        </T>
      ) : anyPassed ? (
        <T role="footnote" tone="secondary">
          Faded times have already passed.
        </T>
      ) : null}
    </View>
  );
}
