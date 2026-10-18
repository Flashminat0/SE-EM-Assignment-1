import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/theme';

const ACircle = Animated.createAnimatedComponent(Circle);

export function CountdownRing({
  progress,
  size = 132,
  stroke = 10,
  colour,
  children,
  style,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  colour?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useColors();
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    p.value = reduce ? clamped : withSpring(clamped, { damping: 18, stiffness: 90, overshootClamping: true });
  }, [progress, reduce, p]);
  const animated = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - Math.min(1, Math.max(0, p.value))) }));
  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.sunken} strokeWidth={stroke} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colour ?? c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={animated}
        />
      </Svg>
      {children}
    </View>
  );
}
