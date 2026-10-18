import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { listPeople, openChannel, type Member } from '@/lib/chat';
import { LIMITS } from '@/lib/chat-parse';
import { friendlyError } from '@/lib/errors';
import { space, useColors } from '@/theme';

export default function NewChat() {
  const c = useColors();
  const router = useRouter();
  const [people, setPeople] = useState<Member[] | null>(null);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    void listPeople()
      .then(setPeople)
      .catch((e: unknown) => {
        setPeople([]);
        setLoadError(friendlyError(e));
      });
  }, []);
  const shown = (people ?? []).filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase()));
  const toggle = (m: Member) =>
    setPicked((v) => (v.some((x) => x.uid === m.uid) ? v.filter((x) => x.uid !== m.uid) : [...v, m]));
  const start = async () => {
    setBusy(true);
    try {
      const id = await openChannel(picked, name);
      router.replace({ pathname: '/chat/[id]', params: { id } });
    } catch (e) {
      Alert.alert('Could not start the chat', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="New chat" tab={false} right={<Button label="Cancel" kind="ghost" onPress={() => router.back()} />}>
      <View style={{ gap: space[4] }}>
        <Field label="Search people" value={q} onChangeText={setQ} placeholder="Name" autoCorrect={false} />
        {picked.length > 1 ? (
          <Field
            label="Group name"
            value={name}
            onChangeText={setName}
            placeholder="SE5070 study group"
            maxLength={LIMITS.name}
          />
        ) : null}
        {people === null ? (
          <T tone="tertiary">Loading…</T>
        ) : loadError ? (
          <T tone="overdue">Could not load people. {loadError}</T>
        ) : shown.length === 0 ? (
          <T tone="tertiary">Nobody found. Ask them to sign up first.</T>
        ) : (
          shown.map((p) => {
            const on = picked.some((x) => x.uid === p.uid);
            return (
              <Pressable
                key={p.uid}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => toggle(p)}
              >
                <Card
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space[3],
                    borderColor: on ? c.accent : c.borderSubtle,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T role="headline">{p.displayName}</T>
                  </View>
                  {on ? <Icon sf="checkmark.circle.fill" android="check_circle" color={c.accent} /> : null}
                </Card>
              </Pressable>
            );
          })
        )}
        <Button
          label={picked.length > 1 ? 'Create group' : 'Start chat'}
          disabled={picked.length === 0}
          loading={busy}
          onPress={() => void start()}
        />
      </View>
    </Screen>
  );
}
