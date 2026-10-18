import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { hit, radius, space, typography, useColors } from '@/theme';
import { T } from './Text';

export function Field({
  label,
  error,
  hint,
  style,
  testID,
  ...rest
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const c = useColors();
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibilityWithOptions(error, { queue: true });
  }, [error]);
  return (
    <View style={{ gap: space[2] }}>
      <T role="footnote" tone="secondary">
        {label}
      </T>
      <TextInput
        {...rest}
        testID={testID ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        accessibilityLabel={label}
        placeholderTextColor={c.textTertiary}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        style={[
          s.input,
          typography.body,
          {
            color: c.textPrimary,
            backgroundColor: c.elevated,
            borderColor: error ? c.overdue : focus ? c.accent : c.borderSubtle,
          },
          style,
        ]}
      />
      {error ? (
        <T role="footnote" tone="overdue" accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : hint ? (
        <T role="footnote" tone="secondary">
          {hint}
        </T>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  input: {
    minHeight: hit + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
});
