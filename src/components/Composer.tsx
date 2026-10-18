import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessage } from '@/lib/chat';
import { LIMITS } from '@/lib/chat-parse';
import { friendlyError } from '@/lib/errors';
import { useOnline } from '@/lib/net';
import { gutter, hit, radius, space, typography, useColors } from '@/theme';
import { Icon } from './Icon';
import { T } from './Text';

const SEND = 36;
const COUNT_FROM = LIMITS.text - 200;

export function Composer({ channelId }: { channelId: string }) {
  const c = useColors();
  const inset = useSafeAreaInsets();
  const online = useOnline();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const ready = online && !sending && text.trim().length > 0;

  const send = async () => {
    setSending(true);
    try {
      await sendMessage(channelId, text.trim());
      setText('');
    } catch (e) {
      Alert.alert('Could not send', friendlyError(e));
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      {text.length >= COUNT_FROM ? (
        <T role="caption" tone={text.length >= LIMITS.text ? 'overdue' : 'tertiary'} style={s.count}>
          {text.length} / {LIMITS.text}
        </T>
      ) : null}
      <View
        style={[
          s.bar,
          { borderTopColor: c.borderSubtle, backgroundColor: c.elevated, paddingBottom: inset.bottom + space[2] },
        ]}
      >
        <TextInput
          testID="message-input"
          value={text}
          onChangeText={setText}
          maxLength={LIMITS.text}
          placeholder={online ? 'Message' : 'Offline. Messages need a connection.'}
          placeholderTextColor={c.textTertiary}
          editable={online && !sending}
          multiline
          accessibilityLabel="Message"
          style={[
            s.input,
            typography.body,
            { color: c.textPrimary, backgroundColor: c.canvas, borderColor: c.borderSubtle },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!ready}
          onPress={() => void send()}
          hitSlop={(hit - SEND) / 2}
          style={[s.send, { backgroundColor: c.accent, opacity: ready ? 1 : 0.4 }]}
        >
          <Icon sf="arrow.up" android="arrow_upward" size={20} color={c.onAccent} />
        </Pressable>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  count: { alignSelf: 'flex-end', paddingHorizontal: gutter },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  send: {
    width: SEND,
    height: SEND,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
});
