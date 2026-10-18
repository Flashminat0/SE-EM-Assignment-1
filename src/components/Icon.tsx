import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export function Icon({
  sf,
  android,
  size = 24,
  color,
  accessibilityLabel,
}: {
  sf: SFSymbol;
  android: string;
  size?: number;
  color: ColorValue;
  accessibilityLabel?: string;
}) {
  return (
    <SymbolView
      name={{ ios: sf, android: android as never }}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
