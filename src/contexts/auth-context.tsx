import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';

import type { AdminAccount } from '@/constants/admin-account';
import { ensureDefaultAdminAccount, fetchAdminAccount } from '@/services/admin';
import {
  signInAdmin,
  signOutAdmin,
  subscribeToAuthState,
  type SignInResult,
  type SignOutResult,
} from '@/services/auth';

type AuthContextValue = {
  /** The signed-in admin, or null when browsing anonymously. */
  user: User | null;
  /** Organization + role profile for the signed-in admin. */
  adminAccount: AdminAccount | null;
  /** True while the initial auth state is being restored. */
  isInitializing: boolean;
  /** True when an admin is signed in. */
  isAuthenticated: boolean;
  /** True when the signed-in admin has the superadmin role. */
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<SignOutResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isAdminProfileLoading, setIsAdminProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setIsAuthInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminAccount() {
      if (!user) {
        if (isMounted) {
          setAdminAccount(null);
          setIsAdminProfileLoading(false);
        }
        return;
      }

      setIsAdminProfileLoading(true);

      try {
        const account = await ensureDefaultAdminAccount(user);
        if (isMounted) {
          setAdminAccount(account ?? (await fetchAdminAccount(user.uid)));
        }
      } finally {
        if (isMounted) {
          setIsAdminProfileLoading(false);
        }
      }
    }

    void loadAdminAccount();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInAdmin(email, password);
    if (result.ok) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const result = await signOutAdmin();
    // `onAuthStateChanged` updates `user` when Firebase confirms sign-out.
    // Do not clear local state if Firebase logout failed.
    return result;
  }, []);

  const isInitializing = isAuthInitializing || (user !== null && isAdminProfileLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      adminAccount,
      isInitializing,
      isAuthenticated: user !== null,
      isSuperAdmin: adminAccount?.role === 'superadmin',
      signIn,
      signOut,
    }),
    [user, adminAccount, isInitializing, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth måste användas inom AuthProvider');
  }

  return context;
}
