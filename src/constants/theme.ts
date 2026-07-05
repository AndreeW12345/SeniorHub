import '@/global.css';

import { Platform } from 'react-native';

/** SeniorHub color palette. The app currently uses the light theme only. */
export const Colors = {
  light: {
    text: '#102A43',
    background: '#F6F9FC',
    backgroundElement: '#EDF3F9',
    backgroundSelected: '#D9E8F6',
    textSecondary: '#627D98',
    primary: '#004E87',
    primaryLight: '#E8F2FA',
    border: '#D9E2EC',
    card: '#FFFFFF',
    favorite: '#C81E3A',
    searchBackground: '#FFFFFF',
    imageOverlay: 'rgba(0, 42, 74, 0.28)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#004E87',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 28,
  },
  android: {
    elevation: 2,
  },
  web: {
    boxShadow: '0 10px 40px rgba(0, 78, 135, 0.07)',
  },
});

export const SoftShadow = Platform.select({
  ios: {
    shadowColor: '#004E87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  android: {
    elevation: 1,
  },
  web: {
    boxShadow: '0 4px 20px rgba(0, 78, 135, 0.05)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 880;
