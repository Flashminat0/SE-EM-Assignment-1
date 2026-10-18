import type { ComponentProps } from 'react';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { claimLocalData, ensureProfile, useUser } from '@/lib/auth';
import { ensurePermission, scheduleAll } from '@/lib/notifications';
import { startSyncLoop } from '@/lib/sync';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const user = useUser();
  const router = useRouter();
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.canvas,
      card: colors.elevated,
      text: colors.textPrimary,
      primary: colors.accent,
      border: colors.borderSubtle,
    },
  };

  useEffect(() => {
    if (user !== undefined) void SplashScreen.hideAsync();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let stopSync: (() => void) | undefined;
    let cancelled = false;
    void claimLocalData(user.uid).then(() => {
      if (cancelled) return;
      void ensureProfile(user);
      void ensurePermission().then(scheduleAll);
      stopSync = startSyncLoop();
    });
    return () => {
      cancelled = true;
      stopSync?.();
    };
  }, [user]);

  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    const open = (n: Notifications.Notification) => {
      const id = n.request.content.data?.alarmId;
      if (typeof id === 'string') router.push({ pathname: '/alarm/[id]', params: { id } });
    };
    const a = Notifications.addNotificationReceivedListener(open);
    const b = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => {
      a.remove();
      b.remove();
    };
  }, [router, signedIn]);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Protected guard={!!user}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="edit/course" options={sheet} />
            <Stack.Screen name="edit/lecture" options={sheet} />
            <Stack.Screen name="edit/assignment" options={sheet} />
            <Stack.Screen name="edit/exam" options={sheet} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="courses" options={{ presentation: 'modal' }} />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="chat/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen
              name="alarm/[id]"
              options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!user}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
const sheet: ComponentProps<typeof Stack.Screen>['options'] = {
  presentation: 'formSheet',
  sheetAllowedDetents: [0.9, 1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 22,
};
