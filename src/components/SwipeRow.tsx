import * as Haptics from 'expo-haptics';
import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { radius, rowMinHeight, space, useColors } from '@/theme';
import { Icon } from './Icon';
import { T } from './Text';

export function SwipeRow({
  children,
  onComplete,
  onDelete,
  completeLabel = 'Done',
  deleteLabel = 'Delete',
}: {
  children: ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  completeLabel?: string;
  deleteLabel?: string;
}) {
  const c = useColors();
  const ref = useRef<SwipeableMethods>(null);
  const action = (
    bg: string,
    label: string,
    sf: 'checkmark' | 'trash',
    android: string,
    align: 'flex-start' | 'flex-end',
  ) => (
    <View style={[s.action, { backgroundColor: bg, alignItems: align }]}>
      <View style={{ alignItems: 'center', gap: space[1], paddingHorizontal: space[5] }}>
        <Icon sf={sf} android={android} size={22} color={c.onAccent} />
        <T role="caption" tone="onAccent">
          {label}
        </T>
      </View>
    </View>
  );
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      leftThreshold={72}
      rightThreshold={72}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={
        onComplete ? () => action(c.done, completeLabel, 'checkmark', 'check', 'flex-start') : undefined
      }
      renderRightActions={onDelete ? () => action(c.overdue, deleteLabel, 'trash', 'delete', 'flex-end') : undefined}
      onSwipeableOpen={(dir) => {
        if (dir === 'right' && onComplete) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          ref.current?.close();
          onComplete();
        }
        if (dir === 'left' && onDelete) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          ref.current?.close();
          onDelete();
        }
      }}
      containerStyle={{ borderRadius: radius.md, overflow: 'hidden' }}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
const s = StyleSheet.create({ action: { flex: 1, justifyContent: 'center', minHeight: rowMinHeight } });
