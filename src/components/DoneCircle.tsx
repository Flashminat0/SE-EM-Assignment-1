import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { hit, useColors } from '@/theme';
import { Icon } from './Icon';

export function DoneCircle({ done, onChange }: { done: boolean; onChange: (done: boolean) => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={done ? 'Done, tap to reopen' : 'Mark done'}
      accessibilityState={{ checked: done }}
      onPress={() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onChange(!done);
      }}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 28,
        height: 28,
        borderRadius: hit,
        borderWidth: 2,
        borderColor: done ? c.done : c.borderStrong,
        backgroundColor: done ? c.done : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {done ? <Icon sf="checkmark" android="check" size={16} color={c.onAccent} /> : null}
    </Pressable>
  );
}
