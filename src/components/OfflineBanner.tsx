import { View } from 'react-native';
import { useOnline } from '@/lib/net';
import { gutter, space, useColors } from '@/theme';
import { T } from './Text';

export function OfflineBanner() {
  const online = useOnline();
  const c = useColors();
  if (online) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: c.offlineSoft, paddingVertical: space[2], paddingHorizontal: gutter }}
    >
      <T role="footnote" tone="offline">
        Offline
      </T>
    </View>
  );
}
