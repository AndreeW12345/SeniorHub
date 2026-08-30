import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';

const BREAKPOINTS = {
  tablet: 600,
  desktop: 960,
} as const;

/** Used during static web export when no browser viewport exists yet. */
const STATIC_EXPORT_FALLBACK_WIDTH = 1280;

function readViewportWidth(windowDimensionsWidth: number): number {
  if (windowDimensionsWidth > 0) {
    return windowDimensionsWidth;
  }

  if (typeof window !== 'undefined' && window.innerWidth > 0) {
    return window.innerWidth;
  }

  return STATIC_EXPORT_FALLBACK_WIDTH;
}

/**
 * Web-specific responsive hook.
 * Static export/SSR has no viewport during render; the native hook returns 0 and
 * inline max-width:0 collapsed the layout on desktop. This reads window width
 * on the client and uses a safe fallback during static generation.
 */
export function useResponsive() {
  const { width: windowDimensionsWidth, height: windowDimensionsHeight } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(() => readViewportWidth(windowDimensionsWidth));

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(readViewportWidth(windowDimensionsWidth));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [windowDimensionsWidth]);

  const width = viewportWidth;
  const height =
    windowDimensionsHeight > 0
      ? windowDimensionsHeight
      : typeof window !== 'undefined'
        ? window.innerHeight
        : 800;

  const isCompact = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  return {
    width,
    height,
    isCompact,
    isTablet,
    isDesktop,
    columns: (isDesktop ? 2 : 1) as 1 | 2,
    contentWidth: Math.min(width, isDesktop ? 1120 : MaxContentWidth),
    horizontalPadding: isCompact ? 20 : isTablet ? 28 : 36,
    sectionGap: isCompact ? 24 : 32,
    cardGap: isCompact ? 20 : 28,
    imageHeight: isCompact ? 210 : isDesktop ? 280 : 240,
    headerPaddingBottom: isCompact ? 28 : 36,
  };
}
