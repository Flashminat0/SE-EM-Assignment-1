import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, kind = 'primary', disabled, loading, style }: Props) {
  const c = useColors();
  const bg =
    kind === 'primary'
      ? c.accent
      : kind === 'secondary'
        ? c.sunken
        : kind === 'destructive'
          ? c.overdue
          : 'transparent';
  const fg = kind === 'primary' || kind === 'destructive' ? 'onAccent' : kind === 'ghost' ? 'accent' : 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        s.base,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c[fg === 'onAccent' ? 'onAccent' : 'textPrimary']} />
      ) : (
        <T role="headline" tone={fg}>
          {label}
        </T>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: {
    minHeight: hit + 6,
    borderRadius: radius.md,
    paddingHorizontal: space[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
