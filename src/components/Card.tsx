import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { radius, space, useColors } from '@/theme';

export function Card({
  style,
  onPress,
  children,
  ...rest
}: ViewProps & { onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const base = [s.card, { backgroundColor: c.elevated, borderColor: c.borderSubtle }, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...base, { opacity: pressed ? 0.85 : 1 }]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}
const s = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space[4], gap: space[2] },
});
