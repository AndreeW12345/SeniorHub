import { getAuth, type ActionCodeSettings } from 'firebase-admin/auth';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { RESEND_API_KEY } from '../config/secrets';
import { sendLoginMagicLinkEmail } from '../email/organizer-application-emails';
import { readEmail } from '../utils/input-validation';
import { assertRateLimit, assertRateLimitWindow } from '../utils/rate-limit';

type RequestLoginMagicLinkResponse = {
  ok: true;
};

const CHECK_LOGIN_EMAIL_COOLDOWN_MS = 3_000;
const LOGIN_MAGIC_LINK_IP_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAGIC_LINK_IP_MAX_ATTEMPTS = 10;
const APP_BUNDLE_ID = 'com.andreew12345.seniorhub';
const ALLOWED_AUTH_COMPLETE_PATHS = new Set(['/auth/complete', '/app/auth/complete']);

type ActionCodeSettingsInput = {
  url?: unknown;
  handleCodeInApp?: unknown;
  linkDomain?: unknown;
  iOS?: { bundleId?: unknown };
  android?: { packageName?: unknown; installApp?: unknown; minimumVersion?: unknown };
};

function readProjectId(): string | null {
  if (process.env.GCLOUD_PROJECT?.trim()) {
    return process.env.GCLOUD_PROJECT.trim();
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (!firebaseConfig) {
    return null;
  }

  try {
    const parsed = JSON.parse(firebaseConfig) as { projectId?: string };
    return typeof parsed.projectId === 'string' && parsed.projectId.trim().length > 0
      ? parsed.projectId.trim()
      : null;
  } catch {
    return null;
  }
}

function getAllowedHostingHostnames(): Set<string> {
  const hosts = new Set<string>();
  const configuredHosting = process.env.HOSTING_DOMAIN?.trim();
  if (configuredHosting) {
    hosts.add(configuredHosting.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  }

  const projectId = readProjectId();
  if (projectId) {
    hosts.add(`${projectId}.web.app`);
    hosts.add(`${projectId}.firebaseapp.com`);
  }

  hosts.add('seniorhub.se');
  hosts.add('seniorhub-se.web.app');

  return hosts;
}

function readClientIp(request: CallableRequest): string {
  const raw = request.rawRequest;
  if (!raw) {
    return 'unknown';
  }

  const forwarded = raw.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  if (typeof raw.ip === 'string' && raw.ip.trim().length > 0) {
    return raw.ip.trim();
  }

  return 'unknown';
}

function validateActionCodeSettings(value: unknown): ActionCodeSettings {
  if (!value || typeof value !== 'object') {
    throw new HttpsError('invalid-argument', 'Ogiltiga inloggningsinställningar.');
  }

  const input = value as ActionCodeSettingsInput;
  if (input.handleCodeInApp !== true) {
    throw new HttpsError('invalid-argument', 'Ogiltiga inloggningsinställningar.');
  }

  if (typeof input.url !== 'string' || !input.url.trim()) {
    throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url.trim());
  } catch {
    throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
  }

  const allowedHosts = getAllowedHostingHostnames();
  if (!allowedHosts.has(parsedUrl.hostname)) {
    throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
  }

  if (!ALLOWED_AUTH_COMPLETE_PATHS.has(parsedUrl.pathname)) {
    throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
  }

  if (input.linkDomain !== undefined) {
    const linkDomain =
      typeof input.linkDomain === 'string' ? input.linkDomain.trim().replace(/\/$/, '') : '';
    if (!linkDomain || !allowedHosts.has(linkDomain)) {
      throw new HttpsError('invalid-argument', 'Ogiltig inloggnings-URL.');
    }
  }

  const settings: ActionCodeSettings = {
    url: parsedUrl.toString(),
    handleCodeInApp: true,
  };

  if (input.iOS !== undefined) {
    const bundleId =
      typeof input.iOS.bundleId === 'string' ? input.iOS.bundleId.trim() : '';
    if (bundleId !== APP_BUNDLE_ID) {
      throw new HttpsError('invalid-argument', 'Ogiltiga iOS-inloggningsinställningar.');
    }

    settings.iOS = { bundleId: APP_BUNDLE_ID };
  }

  if (input.android !== undefined) {
    const packageName =
      typeof input.android.packageName === 'string' ? input.android.packageName.trim() : '';
    if (packageName !== APP_BUNDLE_ID) {
      throw new HttpsError('invalid-argument', 'Ogiltiga Android-inloggningsinställningar.');
    }

    settings.android = {
      packageName: APP_BUNDLE_ID,
      installApp: input.android.installApp === true,
      minimumVersion:
        typeof input.android.minimumVersion === 'string'
          ? input.android.minimumVersion.trim()
          : undefined,
    };
  }

  return settings;
}

/**
 * Requests a login magic link without revealing whether the email is registered.
 * Sends email via Resend only when a Firebase Auth user exists.
 */
export const requestLoginMagicLink = onCall(
  {
    ...europeWest1CallableOptions(),
    secrets: [RESEND_API_KEY],
  },
  async (request): Promise<RequestLoginMagicLinkResponse> => {
    const email = readEmail(request.data?.email);
    if (!email) {
      throw new HttpsError('invalid-argument', 'Ange en giltig e-postadress.');
    }

    const actionCodeSettings = validateActionCodeSettings(request.data?.actionCodeSettings);
    const clientIp = readClientIp(request);

    await assertRateLimit({
      docPath: `security/requestLoginMagicLink/attempts/email/${email}`,
      cooldownMs: CHECK_LOGIN_EMAIL_COOLDOWN_MS,
    });

    await assertRateLimitWindow({
      docPath: `security/requestLoginMagicLink/attempts/ip/${clientIp}`,
      windowMs: LOGIN_MAGIC_LINK_IP_WINDOW_MS,
      maxAttempts: LOGIN_MAGIC_LINK_IP_MAX_ATTEMPTS,
    });

    try {
      await getAuth().getUserByEmail(email);
    } catch (error) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : '';

      if (code === 'auth/user-not-found') {
        return { ok: true };
      }

      console.error('[requestLoginMagicLink] Failed to look up Auth user:', error);
      throw new HttpsError(
        'internal',
        'Kunde inte skicka inloggningslänken just nu. Försök igen.',
      );
    }

    try {
      const signInLink = await getAuth().generateSignInWithEmailLink(email, actionCodeSettings);
      await sendLoginMagicLinkEmail(RESEND_API_KEY.value(), email, signInLink);
    } catch (error) {
      console.error('[requestLoginMagicLink] Failed to send login magic link:', error);
      return { ok: true };
    }

    return { ok: true };
  },
);
