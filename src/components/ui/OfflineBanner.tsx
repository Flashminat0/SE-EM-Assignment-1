import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { recheck, useOnline } from '@/lib/sync/net';
import { syncNow } from '@/lib/sync/sync';
import { radius, space, useColors } from '@/theme';
import { Icon } from './Icon';
import { T } from './Text';

type Label = 'Offline' | 'Checking…' | 'Back online';

export function OfflineBanner() {
  const online = useOnline();
  const c = useColors();
  const [label, setLabel] = useState<Label>('Offline');

  // Tap to retry now; show "Back online" for a moment before the pill goes
  const retry = async () => {
    setLabel('Checking…');
    if (!(await recheck())) return setLabel('Offline');
    setLabel('Back online');
    syncNow();
    setTimeout(() => setLabel('Offline'), 1500);
  };

  if (online && label !== 'Back online') return null;

  const back = label === 'Back online';

  return (
    <View style={{ alignItems: 'center', paddingTop: space[1] }} accessibilityLiveRegion="polite">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={back ? 'Back online' : 'Offline, tap to retry'}
        onPress={() => void retry()}
        disabled={label !== 'Offline'}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[1],
          backgroundColor: back ? c.accentSoft : c.offlineSoft,
          borderRadius: radius.pill,
          paddingVertical: space[1],
          paddingHorizontal: space[3],
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon
          sf={back ? 'wifi' : 'wifi.slash'}
          android={back ? 'wifi' : 'wifi_off'}
          size={13}
          color={back ? c.accent : c.offline}
        />
        <T role="caption" tone={back ? 'accent' : 'offline'}>
          {label}
        </T>
      </Pressable>
    </View>
  );
}
