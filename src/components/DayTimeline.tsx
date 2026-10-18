import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { fmtMin } from '@/lib/format';
import type { TimelineItem } from '@/lib/timeline';
import { courseColours, courseFill, radius, space, typography, useColors, type TypeRole } from '@/theme';
import { T } from './Text';

const HOUR = 64;
const PAD = space[1];

export function DayTimeline({
  items,
  startHour = 7,
  endHour = 21,
  nowMin,
  onPressItem,
  onPressSlot,
}: {
  items: TimelineItem[];
  startHour?: number;
  endHour?: number;
  nowMin?: number;
  onPressItem: (item: TimelineItem) => void;
  onPressSlot: (startMin: number) => void;
}) {
  const c = useColors();
  const { fontScale } = useWindowDimensions();
  const first = Math.min(startHour, ...items.map((l) => Math.floor(l.startMin / 60)));
  const last = Math.max(endHour, ...items.map((l) => Math.ceil(l.endMin / 60)));
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const y = (min: number) => ((min - first * 60) / 60) * HOUR;
  const lines = (...roles: TypeRole[]) => roles.reduce((sum, r) => sum + typography[r].lineHeight, 0) * fontScale;
  return (
    <View style={{ height: (last - first) * HOUR + HOUR / 2 }}>
      {hours.map((h) => (
        <Pressable
          key={h}
          disabled={h >= 24}
          accessible={h < 24}
          accessibilityLabel={h < 24 ? `Add lecture at ${fmtMin(h * 60)}` : undefined}
          onPress={(e) => onPressSlot(h * 60 + (e.nativeEvent.locationY > HOUR / 2 ? 30 : 0))}
          style={[s.hour, { top: y(h * 60) }]}
        >
          <T role="caption" tone="tertiary" style={s.label}>
            {fmtMin(h * 60)}
          </T>
          <View style={[s.line, { backgroundColor: c.borderSubtle }]} />
        </Pressable>
      ))}
      {items.map((l) => {
        const tint = courseColours[l.colour % courseColours.length];
        const height = Math.max(HOUR / 2, y(l.endMin) - y(l.startMin));
        const inner = height - 2 * PAD;
        const name = l.title;
        const when = l.detail;
        const label = l.kind === 'lecture' ? l.code : `${l.code} · ${l.kind === 'exam' ? 'Exam' : 'Due'}`;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            accessibilityLabel={[label, name, when].filter(Boolean).join(', ')}
            onPress={() => onPressItem(l)}
            style={({ pressed }) => [
              s.block,
              {
                top: y(l.startMin),
                height,
                backgroundColor: tint + courseFill.block,
                borderLeftColor: tint,
                borderStyle: l.kind === 'lecture' ? 'solid' : 'dashed',
                borderWidth: l.kind === 'lecture' ? 0 : 1,
                borderLeftWidth: 3,
                borderColor: tint,
                opacity: pressed ? 0.8 : l.done ? 0.5 : 1,
              },
            ]}
          >
            {inner >= lines('caption', 'headline', 'footnote') ? (
              <>
                <T role="caption" tone="secondary" numberOfLines={1}>
                  {label}
                </T>
                <T
                  role="headline"
                  numberOfLines={inner >= lines('caption', 'headline', 'headline', 'footnote') ? 2 : 1}
                  style={l.done ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {name}
                </T>
                <T role="footnote" tone="secondary" numberOfLines={1}>
                  {when}
                </T>
              </>
            ) : (
              <>
                {inner >= lines('headline', 'footnote') ? (
                  <T role="headline" numberOfLines={1}>
                    {name}
                  </T>
                ) : null}
                <T
                  role="footnote"
                  tone="secondary"
                  numberOfLines={1}
                  maxFontSizeMultiplier={Math.max(1, inner / typography.footnote.lineHeight)}
                >
                  <T role="footnote">{`${label}  `}</T>
                  {when}
                </T>
              </>
            )}
          </Pressable>
        );
      })}
      {nowMin !== undefined && nowMin >= first * 60 && nowMin <= last * 60 ? (
        <View pointerEvents="none" style={[s.now, { top: y(nowMin) }]}>
          <View style={[s.nowDot, { backgroundColor: c.overdue }]} />
          <View style={[s.nowLine, { backgroundColor: c.overdue }]} />
        </View>
      ) : null}
    </View>
  );
}
const LABEL_W = 64;
const s = StyleSheet.create({
  hour: { position: 'absolute', left: 0, right: 0, height: HOUR, flexDirection: 'row', alignItems: 'flex-start' },
  label: { width: LABEL_W, marginTop: -8 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  block: {
    position: 'absolute',
    left: LABEL_W,
    right: 0,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    paddingHorizontal: space[3],
    paddingVertical: PAD,
    overflow: 'hidden',
  },
  now: { position: 'absolute', left: LABEL_W - 6, right: 0, flexDirection: 'row', alignItems: 'center' },
  nowDot: { width: 10, height: 10, borderRadius: 5 },
  nowLine: { flex: 1, height: 2 },
});
