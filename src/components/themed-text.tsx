import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'bodyLarge'
    | 'cardTitle'
    | 'sectionTitle'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'linkPrimary';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'bodyLarge' && styles.bodyLarge,
        type === 'cardTitle' && [styles.cardTitle, isDesktop && styles.cardTitleDesktop],
        type === 'sectionTitle' && [styles.sectionTitle, isDesktop && styles.sectionTitleDesktop],
        type === 'title' && [styles.title, isDesktop && styles.titleDesktop],
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'linkPrimary' && styles.linkPrimary,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  smallBold: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  default: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontSize: 21,
    lineHeight: 32,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  sectionTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionTitleDesktop: {
    fontSize: 28,
    lineHeight: 36,
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardTitleDesktop: {
    fontSize: 30,
    lineHeight: 38,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  titleDesktop: {
    fontSize: 42,
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 19,
    color: '#004E87',
  },
});
