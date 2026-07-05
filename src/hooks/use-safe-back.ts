import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

const ACTIVITIES_ROUTE = '/' as Href;

/**
 * Safe back navigation for the activity detail screen.
 * Falls back to the Aktiviteter tab when there is no history entry,
 * which avoids the web "GO_BACK was not handled" error.
 */
export function useSafeBack() {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ACTIVITIES_ROUTE);
  }, [router]);
}
