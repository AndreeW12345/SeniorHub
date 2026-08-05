import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { isAuthEmailLink } from '@/services/auth';

function isAlreadyOnCompleteRoute(url: string): boolean {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.pathname.includes('/auth/complete');
    }

    const parsed = Linking.parse(url);
    const path = parsed.path ?? '';
    return path.includes('auth/complete');
  } catch {
    return url.includes('/auth/complete');
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
      if (!url || !isAuthEmailLink(url)) {
        return;
      }

      if (isAlreadyOnCompleteRoute(url)) {
        return;
      }

      router.push(`/auth/complete?link=${encodeURIComponent(url)}` as Href);
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
