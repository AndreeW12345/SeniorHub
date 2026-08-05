import type { AuthProviderModule } from '@/services/auth/providers/types';

/** Future Microsoft provider – not implemented yet. */
export const microsoftProvider: AuthProviderModule = {
  id: 'microsoft',
  label: 'Microsoft',
  isAvailable: false,
};

export async function signInWithMicrosoft(): Promise<never> {
  throw new Error('Microsoft-inloggning är inte aktiverad ännu.');
}
