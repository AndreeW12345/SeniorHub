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
import type { PendingRegistration } from '@/constants/auth';
import { ensureDefaultAdminAccount, fetchAdminAccount } from '@/services/admin';
import {
  sendMagicLink,
  signInWithPasswordAdmin,
  signOutCurrentUser,
  storePendingRegistration,
  subscribeToAuthState,
  type AuthActionResult,
  type AuthResult,
} from '@/services/auth';

type AuthContextValue = {
  /** Firebase Auth user (regular user or admin), or null when signed out. */
  user: User | null;
  /** Organization + role profile when the signed-in user is an admin. */
  adminAccount: AdminAccount | null;
  /** True while the initial auth state is being restored. */
  isInitializing: boolean;
  /** True when any Firebase Auth user is signed in (user or admin). */
  isSignedIn: boolean;
  /**
   * True when the signed-in user is an administrator.
   * Kept for existing admin screens (tabs, AdminGuard).
   */
  isAuthenticated: boolean;
  /** Alias for isAuthenticated – prefer this name in new code. */
  isAdmin: boolean;
  /** True when the signed-in admin has the superadmin role. */
  isSuperAdmin: boolean;
  /** Admin password sign-in. Rejects users without an admin profile. */
  signInAdmin: (email: string, password: string) => Promise<AuthResult>;
  /** @deprecated Prefer signInAdmin */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Sends a Magic Link for regular users. */
  sendSignInLink: (email: string) => Promise<AuthActionResult>;
  /** Stores registration details and sends a Magic Link. */
  registerWithMagicLink: (input: PendingRegistration) => Promise<AuthActionResult>;
  /** Signs out the current Firebase Auth session. */
  signOut: () => Promise<AuthActionResult>;
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
        let account = await fetchAdminAccount(user.uid);

        // Password admins may need bootstrap; Magic Link users must never get an admin doc here.
        const usesPasswordProvider = user.providerData.some(
          (provider) => provider.providerId === 'password',
        );
        if (!account && usesPasswordProvider) {
          account = await ensureDefaultAdminAccount(user);
        }

        if (isMounted) {
          setAdminAccount(account);
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

  const signInAdmin = useCallback(async (email: string, password: string) => {
    const result = await signInWithPasswordAdmin(email, password);
    if (!result.ok) {
      return result;
    }

    // Keep bootstrap for password admins: create admins/{uid} if missing.
    const account =
      (await fetchAdminAccount(result.user.uid)) ??
      (await ensureDefaultAdminAccount(result.user));

    if (!account) {
      await signOutCurrentUser();
      return {
        ok: false as const,
        errorMessage: 'Du har inte behörighet som administratör.',
      };
    }

    setUser(result.user);
    setAdminAccount(account);
    return result;
  }, []);

  const sendSignInLink = useCallback(async (email: string) => {
    return sendMagicLink(email);
  }, []);

  const registerWithMagicLink = useCallback(async (input: PendingRegistration) => {
    await storePendingRegistration(input);
    return sendMagicLink(input.email);
  }, []);

  const signOut = useCallback(async () => {
    const result = await signOutCurrentUser();
    return result;
  }, []);

  const isInitializing = isAuthInitializing || (user !== null && isAdminProfileLoading);
  const isSignedIn = user !== null;
  const isAdmin = adminAccount !== null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      adminAccount,
      isInitializing,
      isSignedIn,
      isAuthenticated: isAdmin,
      isAdmin,
      isSuperAdmin: adminAccount?.role === 'superadmin',
      signInAdmin,
      signIn: signInAdmin,
      sendSignInLink,
      registerWithMagicLink,
      signOut,
    }),
    [
      user,
      adminAccount,
      isInitializing,
      isSignedIn,
      isAdmin,
      signInAdmin,
      sendSignInLink,
      registerWithMagicLink,
      signOut,
    ],
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
