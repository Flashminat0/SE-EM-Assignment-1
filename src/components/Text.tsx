import { Text as RNText, type TextProps } from 'react-native';
import { typography, useColors, type Colors, type TypeRole } from '@/theme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'overdue' | 'done' | 'offline';
const toneKey: Record<Tone, keyof Colors> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accent',
  onAccent: 'onAccent',
  overdue: 'overdue',
  done: 'done',
  offline: 'offline',
};

export function T({
  role = 'body',
  tone = 'primary',
  style,
  ...rest
}: Omit<TextProps, 'role'> & { role?: TypeRole; tone?: Tone }) {
  const c = useColors();
  return <RNText {...rest} style={[typography[role], { color: c[toneKey[tone]] }, style]} />;
}
