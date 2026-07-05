import { useWindowDimensions } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';

const BREAKPOINTS = {
  tablet: 600,
  desktop: 960,
} as const;

/**
 * Shared responsive values for layout, spacing and typography.
 * Breakpoints follow common phone / tablet / desktop widths.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isCompact = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  return {
    width,
    height,
    isCompact,
    isTablet,
    isDesktop,
    columns: isDesktop ? 2 : 1,
    contentWidth: Math.min(width, isDesktop ? 1120 : MaxContentWidth),
    horizontalPadding: isCompact ? 20 : isTablet ? 28 : 36,
    sectionGap: isCompact ? 24 : 32,
    cardGap: isCompact ? 20 : 28,
    imageHeight: isCompact ? 210 : isDesktop ? 280 : 240,
    headerPaddingBottom: isCompact ? 28 : 36,
  };
}
