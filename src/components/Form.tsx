import { useRouter } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { T } from '@/components/Text';
import { friendlyError } from '@/lib/errors';
import { gutter, space, useColors } from '@/theme';

export function Form({
  title,
  canSave,
  onSave,
  onDelete,
  deleteLabel = 'Delete',
  deleteHint = 'This cannot be undone.',
  action,
  children,
}: {
  title: string;
  canSave: boolean;
  onSave: () => unknown;
  onDelete?: () => unknown;
  deleteLabel?: string;
  deleteHint?: string;
  action?: { label: string; onPress: () => unknown };
  children: ReactNode;
}) {
  const c = useColors();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const run = (action: () => unknown, title: string) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    void Promise.resolve()
      .then(action)
      .then(
        () => router.back(),
        (e: unknown) => {
          busy.current = false;
          setSaving(false);
          Alert.alert(title, friendlyError(e));
        },
      );
  };
  const confirmDelete = () =>
    Alert.alert(deleteLabel + '?', deleteHint, [
      { text: 'Cancel', style: 'cancel' },
      { text: deleteLabel, style: 'destructive', onPress: () => run(() => onDelete?.(), 'Not deleted') },
    ]);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.canvas }}
      contentContainerStyle={[s.body, { paddingBottom: inset.bottom + space[12] }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={s.header}>
        <T role="title2" style={{ flex: 1 }}>
          {title}
        </T>
        <Button label="Cancel" kind="ghost" onPress={() => router.back()} />
      </View>
      {children}
      <Button
        label="Save"
        disabled={!canSave}
        loading={saving}
        onPress={() => run(onSave, 'Not saved')}
        style={{ marginTop: space[4] }}
      />
      {action ? (
        <Button
          label={action.label}
          kind="secondary"
          disabled={saving}
          onPress={() => run(action.onPress, 'Not changed')}
        />
      ) : null}
      {onDelete ? <Button label={deleteLabel} kind="ghost" disabled={saving} onPress={confirmDelete} /> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  body: { paddingHorizontal: gutter, paddingTop: space[4], gap: space[5] },
  header: { flexDirection: 'row', alignItems: 'center', marginRight: -space[5] },
});

export const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
