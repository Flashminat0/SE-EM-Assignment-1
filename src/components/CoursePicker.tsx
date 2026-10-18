import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { all, useQuery } from '@/db';
import { courseLabel } from '@/lib/format';
import { courseColours, courseFill, hit, radius, space, useColors } from '@/theme';
import { T } from './Text';

export function CoursePicker({ value, onChange }: { value: string; onChange: (courseId: string) => void }) {
  const c = useColors();
  const router = useRouter();
  const courses = useQuery(() => all('courses', '1=1', [], 'code ASC'));
  const count = useRef(courses.length);
  useEffect(() => {
    const grew = courses.length > count.current;
    count.current = courses.length;
    if (grew) onChange(courses.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a)).id);
    else if (courses.length && !courses.some((k) => k.id === value)) onChange(courses[0].id);
  }, [courses, value, onChange]);
  return (
    <View style={{ gap: space[2] }}>
      <T role="footnote" tone="secondary">
        Course
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
        {courses.map((k) => {
          const on = k.id === value;
          const tint = courseColours[k.colour % courseColours.length];
          return (
            <Pressable
              key={k.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(k.id);
              }}
              style={{
                minHeight: hit,
                paddingHorizontal: space[4],
                borderRadius: radius.pill,
                justifyContent: 'center',
                backgroundColor: on ? tint + courseFill.tag : c.elevated,
                borderWidth: 1,
                borderColor: on ? tint : c.borderSubtle,
              }}
            >
              <T role="callout">{courseLabel(k.code, k.name)}</T>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/edit/course')}
          style={{
            minHeight: hit,
            paddingHorizontal: space[4],
            borderRadius: radius.pill,
            justifyContent: 'center',
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: c.borderStrong,
          }}
        >
          <T role="callout" tone="accent">
            + New course
          </T>
        </Pressable>
      </ScrollView>
    </View>
  );
}
