import { View } from 'react-native';
import { useOnline } from '@/lib/net';
import { radius, space, useColors } from '@/theme';
import { Icon } from './Icon';
import { T } from './Text';

export function OfflineBanner() {
  const online = useOnline();
  const c = useColors();
  if (online) return null;
  return (
    <View style={{ alignItems: 'center', paddingTop: space[1] }} accessibilityLiveRegion="polite">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[1],
          backgroundColor: c.offlineSoft,
          borderRadius: radius.pill,
          paddingVertical: space[1],
          paddingHorizontal: space[3],
        }}
      >
        <Icon sf="wifi.slash" android="wifi_off" size={13} color={c.offline} />
        <T role="caption" tone="offline">
          Offline
        </T>
      </View>
    </View>
  );
}
