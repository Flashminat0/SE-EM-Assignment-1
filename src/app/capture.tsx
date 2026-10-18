import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { T } from '@/components/Text';
import { friendlyError } from '@/lib/errors';
import { setPendingPhoto, shrink } from '@/lib/photo';
import { cameraChrome, gutter, space, useColors } from '@/theme';

const MAX_WIDTH = 1280;

export default function Capture() {
  const c = useColors();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const target = useLocalSearchParams<{ for?: string }>().for ?? '';
  const [perm, request, refresh] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const shoot = async () => {
    if (!cam.current || busy || !ready) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.9 });
      setPendingPhoto(await shrink(pic.uri, Math.min(MAX_WIDTH, pic.width)), target);
      router.back();
    } catch (e) {
      Alert.alert('Photo not taken', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!perm) return <View style={{ flex: 1, backgroundColor: c.sunken }} />;
  if (!perm.granted) {
    return (
      <View style={[s.center, { backgroundColor: c.canvas, paddingTop: inset.top }]}>
        <T role="title2" style={{ textAlign: 'center' }}>
          Camera access needed
        </T>
        <T tone="secondary" style={{ textAlign: 'center', marginTop: space[2] }}>
          Edu-Alarm uses the camera to photograph assignment briefs and whiteboards. Photos stay on this phone.
        </T>
        <Button
          label={perm.canAskAgain ? 'Allow camera' : 'Open Settings'}
          onPress={() => void (perm.canAskAgain ? request() : Linking.openSettings())}
          style={{ marginTop: space[6], alignSelf: 'stretch' }}
        />
        <Button label="Cancel" kind="ghost" onPress={() => router.back()} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: cameraChrome.backdrop }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing="back" onCameraReady={() => setReady(true)} />
      <View style={[s.bar, { paddingBottom: inset.bottom + space[6] }]}>
        <Button
          label="Cancel"
          kind="ghost"
          onPress={() => router.back()}
          style={{ position: 'absolute', left: gutter, bottom: inset.bottom + space[8] }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          accessibilityState={{ disabled: busy || !ready }}
          onPress={() => void shoot()}
          disabled={busy || !ready}
          style={({ pressed }) => [
            s.shutter,
            { borderColor: cameraChrome.shutter, opacity: busy || !ready ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <View style={[s.shutterInner, { backgroundColor: cameraChrome.shutter }]} />
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: space[6] },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30 },
});
