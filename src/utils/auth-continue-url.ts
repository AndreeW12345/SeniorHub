import { Platform } from 'react-native';

/** Must match app.json expo.ios.bundleIdentifier / expo.android.package */
const APP_BUNDLE_ID = 'com.andreew12345.seniorhub';

const AUTH_COMPLETE_PATH = '/auth/complete';

function stripProtocol(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return /\blocalhost\b|127\.0\.0\.1/.test(url);
  }
}

/**
 * Deployed Firebase Hosting domain for Magic Link universal / app links.
 * Used for ActionCodeSettings.url (continue URL) and app associated domains.
 *
 * Note: do NOT pass this value as ActionCodeSettings.linkDomain — Firebase only
 * accepts linkDomain for custom Hosting domains, not default *.web.app domains.
 */
export function getFirebaseHostingLinkDomain(): string {
  const hostingDomain = process.env.EXPO_PUBLIC_FIREBASE_HOSTING_DOMAIN?.trim();
  if (hostingDomain) {
    return stripProtocol(hostingDomain);
  }

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (projectId) {
    return `${projectId}.web.app`;
  }

  throw new Error(
    'Firebase Hosting link domain is not configured. Set EXPO_PUBLIC_FIREBASE_HOSTING_DOMAIN or EXPO_PUBLIC_FIREBASE_PROJECT_ID.',
  );
}

/**
 * HTTPS continue URL embedded in Firebase ActionCodeSettings.url.
 * Must use the deployed Firebase Hosting domain — never localhost or a custom app scheme.
 */
export function getEmailLinkContinueUrl(): string {
  const hostingDomain = getFirebaseHostingLinkDomain();
  const hostingContinueUrl = `https://${hostingDomain}${AUTH_COMPLETE_PATH}`;

  if (Platform.OS === 'web') {
    // Web-only: use the browser origin so auth session and /app share the same domain
    // (e.g. https://seniorhub.se/auth/complete, not a hardcoded *.web.app URL).
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      if (!isLocalhostUrl(origin)) {
        return `${origin}${AUTH_COMPLETE_PATH}`;
      }
    }

    const configured = process.env.EXPO_PUBLIC_AUTH_CONTINUE_URL?.trim();
    if (configured && !isLocalhostUrl(configured)) {
      return configured;
    }

    return hostingContinueUrl;
  }

  return hostingContinueUrl;
}

export function getAppBundleId(): string {
  return APP_BUNDLE_ID;
}
