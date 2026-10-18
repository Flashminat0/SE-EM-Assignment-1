import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { space, useColors } from '@/theme';
import { Button } from './Button';
import { T } from './Text';

export function EmptyState({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', gap: space[4], paddingVertical: space[10] }}>
      <Svg width={96} height={96} viewBox="0 0 96 96" accessibilityElementsHidden>
        <Circle cx={48} cy={52} r={30} stroke={c.borderStrong} strokeWidth={3} fill={c.elevated} />
        <Path d="M48 34v18l12 8" stroke={c.accent} strokeWidth={4} strokeLinecap="round" fill="none" />
        <Path d="M30 20l-8 6M66 20l8 6" stroke={c.borderStrong} strokeWidth={3} strokeLinecap="round" />
      </Svg>
      <T tone="secondary" style={{ textAlign: 'center' }}>
        {text}
      </T>
      {action && onAction ? <Button label={action} onPress={onAction} kind="secondary" /> : null}
    </View>
  );
}
