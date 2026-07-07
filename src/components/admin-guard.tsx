import { useRouter, type Href } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

type AdminGuardProps = {
  children: ReactNode;
};

/**
 * Protects admin-only screens.
 *
 * While auth is initializing, shows a loading state. When the user is not
 * signed in, redirects to the login screen. Anonymous users can still browse
 * the rest of the app.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login' as Href);
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return (
      <ScreenLayout title="Administratör" subtitle="Kontrollerar inloggning">
        <View style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.four }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Kontrollerar inloggning...
          </ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
