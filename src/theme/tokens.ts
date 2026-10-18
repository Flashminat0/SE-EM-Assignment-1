import type { TextStyle } from 'react-native';

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const gutter = space[5];
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const hit = 44;
export const rowMinHeight = 56;

export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;
export type TypeRole = keyof typeof typography;

export const courseColours = [
  '#4F6BED', // indigo
  '#0F9D8A', // teal
  '#CC8604', // amber
  '#D9485F', // rose
  '#8B5CF6', // violet
  '#2F9E63', // emerald
  '#0E8FC7', // sky
  '#E0702A', // orange
] as const;
export type CourseColourIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const courseFill = { tag: '22', block: '26' } as const;

export const cameraChrome = { backdrop: '#000000', shutter: '#FFFFFF' } as const;

export const colors = {
  canvas: '#0F1012',
  elevated: '#1A1B1F',
  sunken: '#080809',
  textPrimary: '#F2F2F0',
  textSecondary: '#A6AAB2',
  textTertiary: '#7E838C',
  onAccent: '#0F1012',
  accent: '#6B93F0',
  accentSoft: '#1B2A4D',
  done: '#4CC585',
  due: '#6B93F0',
  overdue: '#F0655D',
  offline: '#E0A63A',
  offlineSoft: '#2C2410',
  borderSubtle: '#2A2C31',
  borderStrong: '#3C3F46',
};
export type Colors = typeof colors;
