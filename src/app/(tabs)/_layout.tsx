import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColors } from '@/theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.accent} backgroundColor={c.elevated} labelStyle={{ selected: { color: c.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="light_mode" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="timetable">
        <NativeTabs.Trigger.Label>Timetable</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'checklist', selected: 'checklist.checked' }} md="checklist" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alarms">
        <NativeTabs.Trigger.Label>Alarms</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'alarm', selected: 'alarm.fill' }} md="alarm" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
