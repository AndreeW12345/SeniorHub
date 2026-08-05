import { deleteUser } from 'firebase/auth';

import { getFirebaseAuth } from '@/firebase';
import { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
import type { AuthActionResult } from '@/services/auth/providers/types';

/** Deletes the currently signed-in Firebase Auth user. */
export async function deleteCurrentAuthUser(): Promise<AuthActionResult> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  if (!auth || !user) {
    return { ok: false, errorMessage: 'Du är inte inloggad.' };
  }

  try {
    await deleteUser(user);
    return { ok: true };
  } catch (error) {
    console.error('[SeniorHub] Kunde inte ta bort Auth-konto:', error);
    return { ok: false, errorMessage: getSwedishAuthErrorMessage(getAuthErrorCode(error)) };
  }
}
