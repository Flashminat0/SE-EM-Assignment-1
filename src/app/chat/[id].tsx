import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bubble } from '@/components/Bubble';
import { Button } from '@/components/Button';
import { Composer } from '@/components/Composer';
import { IconButton } from '@/components/IconButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { T } from '@/components/Text';
import { blockState, channelTitle, setBlocked, useChannel, useMessages } from '@/lib/chat';
import { friendlyError } from '@/lib/errors';
import { auth } from '@/lib/firebase';
import { useOnline } from '@/lib/net';
import { gutter, hit, space, useColors } from '@/theme';

export default function Conversation() {
  const c = useColors();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const online = useOnline();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = auth.currentUser?.uid ?? '';
  const channel = useChannel(id);
  const { rows: messages, error } = useMessages(id);
  const blocked = channel ? blockState(channel, uid) : 'none';
  const title = channel ? channelTitle(channel, uid) : '';

  const block = (on: boolean) =>
    setBlocked(id, on).catch((e) => Alert.alert(on ? 'Could not block' : 'Could not unblock', friendlyError(e)));
  const confirmBlock = () =>
    Alert.alert(`Block ${title}?`, 'Neither of you can send messages until you unblock.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => void block(true) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas, paddingTop: inset.top }}>
      <View style={s.header}>
        <IconButton
          sf="chevron.left"
          android="arrow_back"
          label="Back"
          color={c.accent}
          onPress={() => router.back()}
        />
        <T role="headline" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {title}
        </T>
        {channel?.kind === 'dm' && blocked !== 'byThem' ? (
          <IconButton
            sf={blocked === 'byMe' ? 'hand.raised.slash' : 'hand.raised'}
            android="block"
            label={blocked === 'byMe' ? 'Unblock' : 'Block'}
            color={blocked === 'byMe' ? c.overdue : c.textSecondary}
            disabled={!online}
            onPress={blocked === 'byMe' ? () => void block(false) : confirmBlock}
          />
        ) : (
          <View style={{ width: hit }} />
        )}
      </View>
      <OfflineBanner />
      {error ? (
        <T role="footnote" tone="overdue" style={{ paddingHorizontal: gutter, paddingVertical: space[2] }}>
          Could not refresh messages. {error}
        </T>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: space[3], gap: space[2] }}
          renderItem={({ item }) => (
            <Bubble m={item} mine={item.senderId === uid} showName={channel?.kind === 'group'} />
          )}
          ListEmptyComponent={
            <T tone="tertiary" style={{ textAlign: 'center', transform: [{ scaleY: -1 }], paddingTop: space[10] }}>
              No messages yet.
            </T>
          }
        />
        {blocked === 'none' ? (
          <Composer channelId={id} />
        ) : (
          <View style={[s.blocked, { borderTopColor: c.borderSubtle, paddingBottom: inset.bottom + space[3] }]}>
            <T role="callout" tone="secondary" style={{ flex: 1 }}>
              {blocked === 'byMe' ? `You blocked ${title}. Unblock to send messages.` : `${title} has blocked you.`}
            </T>
            {blocked === 'byMe' ? (
              <Button kind="ghost" label="Unblock" disabled={!online} onPress={() => void block(false)} />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[2], minHeight: hit + 4 },
  blocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: gutter,
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
