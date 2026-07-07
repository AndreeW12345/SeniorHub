import type { SymbolViewProps } from 'expo-symbols';

import { type ActivityCategory } from '@/constants/activities';

export type CategoryVisual = {
  /** Solid badge background color. */
  background: string;
  /** Text/icon color that reads well on the background. */
  foreground: string;
  /** Soft tint used for large placeholder surfaces. */
  tint: string;
  icon: SymbolViewProps['name'];
};

/** Distinct, high-contrast colors and icons for each activity category. */
export const CATEGORY_VISUALS: Record<ActivityCategory, CategoryVisual> = {
  Promenad: {
    background: '#2E7D32',
    foreground: '#FFFFFF',
    tint: '#E3F1E4',
    icon: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  },
  Fika: {
    background: '#A15C2B',
    foreground: '#FFFFFF',
    tint: '#F4E7DC',
    icon: { ios: 'cup.and.saucer.fill', android: 'local_cafe', web: 'local_cafe' },
  },
  Spel: {
    background: '#6A3FA0',
    foreground: '#FFFFFF',
    tint: '#EDE5F6',
    icon: { ios: 'dice.fill', android: 'casino', web: 'casino' },
  },
  Musik: {
    background: '#C2185B',
    foreground: '#FFFFFF',
    tint: '#FAE1EB',
    icon: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  },
  Träning: {
    background: '#E65100',
    foreground: '#FFFFFF',
    tint: '#FCE7D6',
    icon: { ios: 'figure.strengthtraining.traditional', android: 'fitness_center', web: 'fitness_center' },
  },
  Kultur: {
    background: '#00695C',
    foreground: '#FFFFFF',
    tint: '#DCEEEB',
    icon: { ios: 'theatermasks.fill', android: 'theater_comedy', web: 'theater_comedy' },
  },
  Frivilligt: {
    background: '#1565C0',
    foreground: '#FFFFFF',
    tint: '#DDEAF8',
    icon: { ios: 'hands.sparkles.fill', android: 'volunteer_activism', web: 'volunteer_activism' },
  },
};

/** Returns the visual config for a category. */
export function getCategoryVisual(category: ActivityCategory): CategoryVisual {
  return CATEGORY_VISUALS[category];
}
