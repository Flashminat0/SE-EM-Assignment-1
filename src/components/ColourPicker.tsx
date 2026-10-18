import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { courseColours, hit, space, useColors } from '@/theme';
import { Icon } from './Icon';

export function ColourPicker({ value, onChange }: { value: number; onChange: (index: number) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }} accessibilityRole="radiogroup">
      {courseColours.map((tint, i) => (
        <Pressable
          key={tint}
          accessibilityRole="radio"
          accessibilityLabel={`Colour ${i + 1}`}
          accessibilityState={{ selected: i === value }}
          onPress={() => {
            void Haptics.selectionAsync();
            onChange(i);
          }}
          style={{
            width: hit,
            height: hit,
            borderRadius: hit,
            backgroundColor: tint,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: i === value ? 3 : 0,
            borderColor: c.textPrimary,
          }}
        >
          {i === value ? <Icon sf="checkmark" android="check" size={18} color={c.onAccent} /> : null}
        </Pressable>
      ))}
    </View>
  );
}
