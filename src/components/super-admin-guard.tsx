import { useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import type { AdminAccount } from '@/constants/admin-account';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchAdminAccount } from '@/services/admin/fetch-admin-account';
import { getSuperAdminGuardRedirectTarget } from '@/utils/super-admin-access';

type SuperAdminGuardProps = {
  children: ReactNode;
};

/**
 * Protects SeniorHub superadmin screens.
 * Re-reads admins/{uid} from Firestore and requires role === superadmin.
 */
export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user, isAdmin, isInitializing } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifiedAccount, setVerifiedAccount] = useState<AdminAccount | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifySuperAdminFromFirestore() {
      if (isInitializing) {
        return;
      }

      if (!isAdmin || !user?.uid) {
        if (isMounted) {
          setVerifiedAccount(null);
          setIsVerifying(false);
        }
        return;
      }

      setIsVerifying(true);

      try {
        const account = await fetchAdminAccount(user.uid);
        if (isMounted) {
          setVerifiedAccount(account);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    void verifySuperAdminFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, isInitializing, user?.uid]);

  const redirectTarget = getSuperAdminGuardRedirectTarget({
    isInitializing,
    isVerifying,
    isAdmin,
    verifiedAccount,
  });

  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget as Href);
    }
  }, [redirectTarget, router]);

  if (isInitializing || isVerifying) {
    return (
      <ScreenLayout title="SeniorHub-administration" subtitle="Kontrollerar behörighet">
        <View style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.four }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Kontrollerar behörighet...
          </ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  if (redirectTarget) {
    return null;
  }

  return children;
}
