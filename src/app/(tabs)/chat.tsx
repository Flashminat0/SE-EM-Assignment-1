import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { T } from '@/components/ui/Text';
import { channelTitle, useChannels } from '@/lib/chat/chat';
import { auth } from '@/lib/auth/firebase';
import { ago } from '@/lib/planner/format';
import { useOnline } from '@/lib/sync/net';
import { radius, space, useColors } from '@/theme';

export default function ChatList() {
  const c = useColors();
  const router = useRouter();
  const online = useOnline();
  const { rows: channels, error } = useChannels();

  const uid = auth.currentUser?.uid ?? '';
  // The list comes from the cache offline, so empty can mean three things
  const empty = !online
    ? 'Chat needs a connection to start. Conversations you opened before stay readable here offline.'
    : error
      ? `Could not load your chats. ${error}`
      : 'No conversations yet. Message a classmate.';

  return (
    <Screen
      title="Chat"
      scroll={false}
      right={
        <IconButton
          sf="square.and.pencil"
          android="edit"
          size={26}
          label="New chat"
          color={c.accent}
          disabled={!online}
          onPress={() => router.push('/chat/new')}
        />
      }
    >
      {error && channels.length ? (
        <T role="footnote" tone="overdue" style={{ marginBottom: space[3] }}>
          Showing saved chats. {error}
        </T>
      ) : null}
      <FlatList
        data={channels}
        keyExtractor={(ch) => ch.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: space[3], paddingBottom: space[12] }}
        ListEmptyComponent={
          <EmptyState
            text={empty}
            action={online ? 'Start a chat' : undefined}
            onAction={() => router.push('/chat/new')}
          />
        }
        renderItem={({ item: ch }) => {
          const title = channelTitle(ch, uid);
          const preview = ch.lastMessageText || (ch.kind === 'group' ? `${ch.memberIds.length} members` : 'Say hello');
          return (
            <Card
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: ch.id } })}
              accessibilityLabel={`Chat with ${title}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.pill,
                  backgroundColor: c.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T role="headline" tone="accent">
                  {title.slice(0, 1).toUpperCase()}
                </T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T role="headline" numberOfLines={1}>
                  {title}
                </T>
                <T role="footnote" tone="secondary" numberOfLines={1}>
                  {preview}
                </T>
              </View>
              <T role="caption" tone={ch.blockedBy.length ? 'overdue' : 'tertiary'}>
                {ch.blockedBy.length ? 'Blocked' : ago(ch.lastMessageAt)}
              </T>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
