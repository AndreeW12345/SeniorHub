import { signInWithEmailAndPassword } from 'firebase/auth';

import { getFirebaseAuth } from '@/firebase';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthProviderModule, AuthResult } from '@/services/auth/providers/types';

export const passwordAdminProvider: AuthProviderModule = {
  id: 'password_admin',
  label: 'Administratör (e-post och lösenord)',
  isAvailable: true,
};

/** Signs an administrator in with email and password. */
export async function signInWithPasswordAdmin(
  email: string,
  password: string,
): Promise<AuthResult> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return {
      ok: false,
      errorMessage: 'Firebase är inte konfigurerat. Kontrollera .env-inställningarna.',
    };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, user: credential.user };
  } catch (error) {
    console.error('[SeniorHub] Admininloggning misslyckades:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)) };
  }
}
