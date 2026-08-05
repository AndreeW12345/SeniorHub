import type { AuthProviderModule } from '@/services/auth/providers/types';

/** Future Apple provider – not implemented yet. */
export const appleProvider: AuthProviderModule = {
  id: 'apple',
  label: 'Apple',
  isAvailable: false,
};

export async function signInWithApple(): Promise<never> {
  throw new Error('Apple-inloggning är inte aktiverad ännu.');
}
