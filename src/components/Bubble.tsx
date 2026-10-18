import { StyleSheet, View } from 'react-native';
import type { Message } from '@/lib/chat';
import { fmtTime } from '@/lib/format';
import { radius, space, useColors } from '@/theme';
import { T } from './Text';

export function Bubble({ m, mine, showName }: { m: Message; mine: boolean; showName: boolean }) {
  const c = useColors();
  const side = mine ? 'flex-end' : 'flex-start';
  return (
    <View style={{ alignSelf: side, maxWidth: '82%', gap: 2 }}>
      {showName && !mine ? (
        <T role="caption" tone="tertiary" style={{ marginLeft: space[2] }}>
          {m.senderName}
        </T>
      ) : null}
      <View
        style={{
          backgroundColor: mine ? c.accent : c.elevated,
          borderRadius: radius.lg,
          borderBottomRightRadius: mine ? radius.sm : radius.lg,
          borderBottomLeftRadius: mine ? radius.lg : radius.sm,
          padding: space[3],
          borderWidth: mine ? 0 : StyleSheet.hairlineWidth,
          borderColor: c.borderSubtle,
        }}
      >
        <T tone={mine ? 'onAccent' : 'primary'}>{m.text}</T>
      </View>
      <T role="caption" tone="tertiary" style={{ alignSelf: side, marginHorizontal: space[2] }}>
        {m.pending ? 'Sending…' : fmtTime(m.createdAt)}
      </T>
    </View>
  );
}
