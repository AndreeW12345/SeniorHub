import type { ActionCodeSettings } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { preparePublicCallableRequest } from '@/firebase/prepare-public-callable-request';

type RequestLoginMagicLinkRequest = {
  email: string;
  actionCodeSettings: ActionCodeSettings;
};

type RequestLoginMagicLinkResponse = {
  ok: true;
};

export type RequestLoginMagicLinkResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

/** Requests a login magic link without revealing whether the email is registered. */
export async function requestLoginMagicLink(
  email: string,
  actionCodeSettings: ActionCodeSettings,
): Promise<RequestLoginMagicLinkResult> {
  const prepared = await preparePublicCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<
      RequestLoginMagicLinkRequest,
      RequestLoginMagicLinkResponse
    >(prepared.functions, 'requestLoginMagicLink');
    await callable({
      email: email.trim().toLowerCase(),
      actionCodeSettings,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
