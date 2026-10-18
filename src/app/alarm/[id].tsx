import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { CountdownRing } from '@/components/CountdownRing';
import { T } from '@/components/Text';
import { get, useQuery } from '@/db';
import { fmtTime, weekdaysLong } from '@/lib/format';
import { deleteAlarm, isActive, setAssignmentDone, snooze } from '@/lib/notifications';
import { gutter, space, useColors } from '@/theme';

export default function AlarmScreen() {
  const c = useColors();
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = useQuery(() => {
    const a = get('alarms', id);
    return a && isActive(id) ? a : null;
  }, [id]);
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (!reduce)
      pulse.value = withRepeat(withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduce, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const dismiss = () => {
    const one = alarm && !alarm.weekly ? alarm.id : null;
    close();
    if (one) void deleteAlarm(one);
  };
  const assignment = alarm?.targetType === 'assignment' ? get('assignments', alarm.targetId) : null;
  const done = () => {
    if (assignment) {
      close();
      void setAssignmentDone(assignment, true);
    } else dismiss();
  };
  const doSnooze = async (m: number) => {
    if (alarm) await snooze(alarm.id, m);
    close();
  };

  if (!alarm) {
    return (
      <View style={[s.root, { backgroundColor: c.canvas, paddingTop: inset.top + space[10] }]}>
        <T role="title2">This alarm is gone</T>
        <Button label="Close" onPress={close} kind="secondary" style={{ marginTop: space[6] }} />
      </View>
    );
  }
  const d = new Date(alarm.fireAt);
  return (
    <View
      style={[
        s.root,
        { backgroundColor: c.canvas, paddingTop: inset.top + space[10], paddingBottom: inset.bottom + space[6] },
      ]}
    >
      <T role="caption" tone="tertiary">
        {alarm.targetType.toUpperCase()} REMINDER
      </T>
      <Animated.View style={[pulseStyle, { marginVertical: space[8] }]}>
        <CountdownRing progress={1} size={220} stroke={12}>
          <T role="display">{fmtTime(alarm.fireAt)}</T>
          <T role="footnote" tone="secondary">
            {alarm.weekly ? `every ${weekdaysLong[d.getDay()]}` : weekdaysLong[d.getDay()]}
          </T>
        </CountdownRing>
      </Animated.View>
      <T role="title1" style={{ textAlign: 'center' }}>
        {alarm.label}
      </T>
      <View style={{ flex: 1 }} />
      <T role="footnote" tone="secondary" style={{ marginBottom: space[3] }}>
        Snooze for
      </T>
      <View style={{ flexDirection: 'row', gap: space[3], alignSelf: 'stretch' }}>
        {[10, 30, 60].map((m) => (
          <Button
            key={m}
            label={m === 60 ? '1 h' : `${m} min`}
            kind="secondary"
            onPress={() => void doSnooze(m)}
            style={{ flex: 1 }}
          />
        ))}
      </View>
      <Button
        label={
          assignment
            ? 'Done, assignment finished'
            : alarm.targetType === 'lecture'
              ? "Done, I'm at the lecture"
              : 'Done'
        }
        onPress={done}
        style={{ alignSelf: 'stretch', marginTop: space[4], minHeight: 56 }}
      />
      {assignment ? <Button label="Not yet, just dismiss" kind="ghost" onPress={dismiss} /> : null}
    </View>
  );
}
const s = StyleSheet.create({ root: { flex: 1, alignItems: 'center', paddingHorizontal: gutter } });
