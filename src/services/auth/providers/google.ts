import type { AuthProviderModule } from '@/services/auth/providers/types';

/** Future Google provider – not implemented yet. */
export const googleProvider: AuthProviderModule = {
  id: 'google',
  label: 'Google',
  isAvailable: false,
};

export async function signInWithGoogle(): Promise<never> {
  throw new Error('Google-inloggning är inte aktiverad ännu.');
}
