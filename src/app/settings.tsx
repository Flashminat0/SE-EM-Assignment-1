import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { outbox, useQuery } from '@/db';
import { cachedProfile, ensureProfile, signOut, useUser, type Profile } from '@/lib/auth';
import { usingEmulators } from '@/lib/firebase';
import { fmtDateTime } from '@/lib/format';
import { useOnline } from '@/lib/net';
import { onSyncChange, syncNow, syncStatus } from '@/lib/sync';
import { space } from '@/theme';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function Settings() {
  const router = useRouter();
  const user = useUser();
  const online = useOnline();
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [, tick] = useState(0);
  useEffect(() => onSyncChange(() => tick((n) => n + 1)), []);
  useEffect(() => {
    if (user) void ensureProfile(user).then(setProfile);
  }, [user]);
  const changes = useQuery(outbox.count);
  const waiting = changes ? plural(changes, 'change', 'changes') : '';
  const st = syncStatus();

  const doSignOut = () => {
    router.back();
    void signOut();
  };
  const confirmSignOut = () => {
    if (!waiting) return doSignOut();
    Alert.alert(
      'Sign out and lose what has not synced?',
      `${waiting} ${changes === 1 ? 'has' : 'have'} not reached the server yet. Signing out deletes ${changes === 1 ? 'it' : 'them'} from this phone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(online ? [{ text: 'Sync first', onPress: syncNow }] : []),
        { text: 'Sign out', style: 'destructive' as const, onPress: doSignOut },
      ],
    );
  };

  return (
    <Screen title="Settings" tab={false} right={<Button label="Done" kind="ghost" onPress={() => router.back()} />}>
      <View style={{ gap: space[4] }}>
        <Card>
          <T role="caption" tone="tertiary">
            ACCOUNT
          </T>
          <T role="headline">{profile?.displayName ?? user?.displayName ?? '—'}</T>
          <T tone="secondary">{user?.email}</T>
        </Card>
        <Card>
          <T role="caption" tone="tertiary">
            SYNC{usingEmulators ? ' · LOCAL EMULATORS' : ''}
          </T>
          <T role="headline">
            {!online ? 'Offline' : st.syncing ? 'Syncing…' : waiting ? `${waiting} waiting` : 'Up to date'}
          </T>
          <T role="footnote" tone="secondary">
            {st.lastAt ? `Last synced ${fmtDateTime(st.lastAt)}` : 'Not synced yet'}
          </T>
          {st.lastError ? (
            <T role="footnote" tone="overdue">
              {st.lastError}
            </T>
          ) : null}
          <Button
            label="Sync now"
            kind="secondary"
            disabled={!online || st.syncing}
            onPress={syncNow}
            style={{ marginTop: space[2] }}
          />
        </Card>
        <Button label="Manage courses" kind="secondary" onPress={() => router.push('/courses')} />
        <Button label="Sign out" kind="ghost" onPress={confirmSignOut} />
      </View>
    </Screen>
  );
}
