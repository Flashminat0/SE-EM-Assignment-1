import { Pressable } from 'react-native';
import type { SFSymbol } from 'expo-symbols';
import { hit } from '@/theme';
import { Icon } from './Icon';

type Props = {
  sf: SFSymbol;
  android: string;
  label: string;
  color: string;
  size?: number;
  disabled?: boolean;
  onPress: () => void;
};

export function IconButton({ sf, android, label, color, size = 24, disabled, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: hit,
        height: hit,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Icon sf={sf} android={android} size={size} color={color} />
    </Pressable>
  );
}
