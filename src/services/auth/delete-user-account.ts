import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';

export type DeleteUserAccountResult = { ok: true } | { ok: false; errorMessage: string };

/**
 * Deletes the signed-in user's account and personal data via Cloud Functions.
 * Auth user is removed server-side after Firestore/Storage cleanup.
 */
export async function deleteUserAccount(): Promise<DeleteUserAccountResult> {
  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<Record<string, never>, { ok: true }>(
      prepared.functions,
      'deleteUserAccount',
    );
    await callable({});
    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
