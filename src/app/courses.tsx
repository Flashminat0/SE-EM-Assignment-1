import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CourseTag } from '@/components/controls/CourseTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { T } from '@/components/ui/Text';
import { all, useQuery } from '@/db';
import { space } from '@/theme';

export default function Courses() {
  const router = useRouter();
  const courses = useQuery(() => all('courses', '1=1', [], 'code ASC'));

  return (
    <Screen title="Courses" tab={false} right={<Button label="Done" kind="ghost" onPress={() => router.back()} />}>
      {courses.length === 0 ? (
        <EmptyState text="No courses yet." action="Add a course" onAction={() => router.push('/edit/course')} />
      ) : (
        <View style={{ gap: space[3] }}>
          {courses.map((k) => (
            <Card
              key={k.id}
              onPress={() => router.push({ pathname: '/edit/course', params: { id: k.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}
            >
              <CourseTag code={k.code} name={k.name} colour={k.colour} />
              <View style={{ flex: 1 }}>
                <T role="headline" numberOfLines={1}>
                  {k.name}
                </T>
                {k.lecturerName ? (
                  <T role="footnote" tone="secondary">
                    {k.lecturerName}
                  </T>
                ) : null}
              </View>
            </Card>
          ))}
          <Button label="Add a course" kind="secondary" onPress={() => router.push('/edit/course')} />
        </View>
      )}
    </Screen>
  );
}
