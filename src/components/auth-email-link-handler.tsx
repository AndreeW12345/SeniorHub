import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { resolveAuthEmailLink } from '@/utils/resolve-auth-email-link';

function hasDirectFirebaseAuthParams(
  queryParams: Linking.QueryParams | null | undefined,
): boolean {
  return (
    typeof queryParams?.oobCode === 'string' &&
    typeof queryParams?.apiKey === 'string'
  );
}

function isAuthCompletePath(path: string): boolean {
  return path.includes('auth/complete');
}

function isAlreadyOnCompleteRoute(url: string): boolean {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.includes('__/auth/')) {
        return false;
      }
      return isAuthCompletePath(pathname);
    }

    const parsed = Linking.parse(url);
    const path = parsed.path ?? '';

    if (path.includes('__/auth/')) {
      return false;
    }

    if (isAuthCompletePath(path) && hasDirectFirebaseAuthParams(parsed.queryParams)) {
      return true;
    }

    return isAuthCompletePath(path) && typeof parsed.queryParams?.link === 'string';
  } catch {
    if (url.includes('__/auth/')) {
      return false;
    }

    return url.includes('auth/complete');
  }
}

/**
 * Listens for incoming Magic Link URLs and routes to the completion screen.
 * Skips redirect when the app is already opening `/auth/complete` (avoids double handling).
 */
export function AuthEmailLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const authLink = resolveAuthEmailLink(url);
      if (!authLink) {
        return;
      }

      if (url && isAlreadyOnCompleteRoute(url)) {
        return;
      }

      router.replace(`/auth/complete?link=${encodeURIComponent(authLink)}` as Href);
    };

    void Linking.getInitialURL().then(handleUrl);

    const urlSubscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void Linking.getInitialURL().then(handleUrl);
      }
    });

    return () => {
      urlSubscription.remove();
      appStateSubscription.remove();
    };
  }, [router]);

  return null;
}
