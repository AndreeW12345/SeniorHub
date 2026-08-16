import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { isAuthEmailLink } from '@/services/auth';
import { getEmailLinkContinueUrl } from '@/utils/auth-continue-url';

type SearchParamValue = string | string[] | undefined;

function readSearchParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  const trimmed = value?.trim();
  return trimmed || undefined;
}

function collectCandidates(url: string): string[] {
  const trimmed = url.trim();
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
    try {
      candidates.add(decodeURIComponent(trimmed));
    } catch {
      // Keep encoded candidate only.
    }
  }

  return [...candidates];
}

function readLinkFromQueryParams(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const linkParam = parsed.queryParams?.link;

    if (typeof linkParam === 'string' && linkParam.trim()) {
      const trimmed = linkParam.trim();
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    }
  } catch {
    // Fall through.
  }

  return null;
}

function buildUrlFromRouterParams(
  params: Record<string, SearchParamValue> | undefined,
): string | null {
  if (!params) {
    return null;
  }

  const apiKey = readSearchParam(params.apiKey);
  const oobCode = readSearchParam(params.oobCode);
  if (!apiKey || !oobCode) {
    return null;
  }

  const queryParams: Record<string, string> = { apiKey, oobCode };
  const mode = readSearchParam(params.mode);
  const lang = readSearchParam(params.lang);

  if (mode) {
    queryParams.mode = mode;
  }

  if (lang) {
    queryParams.lang = lang;
  }

  const continueUrl = new URL(getEmailLinkContinueUrl());
  for (const [key, value] of Object.entries(queryParams)) {
    continueUrl.searchParams.set(key, value);
  }

  return continueUrl.toString();
}

/**
 * Resolves a Firebase Magic Link URL from deep links, universal links, or wrapped query params.
 */
export function resolveAuthEmailLink(
  url: string | null | undefined,
  webHref?: string | null,
  routerParams?: Record<string, SearchParamValue>,
): string | null {
  const sources: string[] = [];

  if (url?.trim()) {
    sources.push(url.trim());
    const nested = readLinkFromQueryParams(url);
    if (nested) {
      sources.push(nested);
    }
  }

  // Custom scheme links from Hosting fallback (seniorhub://auth/complete?...).
  if (url?.trim() && url.includes('://')) {
    try {
      const parsed = Linking.parse(url);
      const builtFromScheme = buildUrlFromRouterParams({
        apiKey: readSearchParam(parsed.queryParams?.apiKey as SearchParamValue),
        oobCode: readSearchParam(parsed.queryParams?.oobCode as SearchParamValue),
        mode: readSearchParam(parsed.queryParams?.mode as SearchParamValue),
        lang: readSearchParam(parsed.queryParams?.lang as SearchParamValue),
      });
      if (builtFromScheme) {
        sources.push(builtFromScheme);
      }
    } catch {
      // Fall through.
    }
  }

  if (webHref?.trim()) {
    sources.push(webHref.trim());
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.href) {
    sources.push(window.location.href);
  }

  const builtFromParams = buildUrlFromRouterParams(routerParams);
  if (builtFromParams) {
    sources.push(builtFromParams);
  }

  for (const source of sources) {
    for (const candidate of collectCandidates(source)) {
      if (isAuthEmailLink(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export { readSearchParam };
