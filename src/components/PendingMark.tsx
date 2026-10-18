import { useColors } from '@/theme';
import { Icon } from './Icon';

export function PendingMark({ pending }: { pending: boolean }) {
  const c = useColors();
  if (!pending) return null;
  return (
    <Icon
      sf="clock.arrow.circlepath"
      android="schedule"
      size={16}
      color={c.offline}
      accessibilityLabel="Waiting to sync"
    />
  );
}
