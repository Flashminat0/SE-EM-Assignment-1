import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const c = useColors();
  return (
    <View style={[s.wrap, { backgroundColor: c.sunken }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(o.key);
            }}
            style={[
              s.seg,
              on && { backgroundColor: c.elevated, borderColor: c.borderSubtle, borderWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <T role="callout" tone={on ? 'primary' : 'secondary'}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radius.md, padding: space[1] },
  seg: { flex: 1, minHeight: hit, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md - 2 },
});
