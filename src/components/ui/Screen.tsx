import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, space, useColors } from '@/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { T } from '@/components/ui/Text';

type Props = {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  tab?: boolean;
};

export function Screen({ title, right, children, scroll = true, tab = true }: Props) {
  const c = useColors();
  const inset = useSafeAreaInsets();

  // Modal screens already sit below the status bar
  const top = tab || Platform.OS === 'android' ? inset.top : 0;
  const header = title ? (
    <View style={s.header}>
      <T role="title1" style={{ flex: 1 }}>
        {title}
      </T>
      {right}
    </View>
  ) : null;
  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas, paddingTop: top }}>
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[s.pad, { paddingBottom: space[12] + (tab ? 0 : inset.bottom) }]}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, s.pad]}>{body}</View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: gutter },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: space[3], paddingBottom: space[4], gap: space[3] },
});
