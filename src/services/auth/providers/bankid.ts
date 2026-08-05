import type { AuthProviderModule } from '@/services/auth/providers/types';

/** Future BankID provider – not implemented yet. */
export const bankIdProvider: AuthProviderModule = {
  id: 'bankid',
  label: 'BankID',
  isAvailable: false,
};

export async function signInWithBankId(): Promise<never> {
  throw new Error('BankID-inloggning är inte aktiverad ännu.');
}
