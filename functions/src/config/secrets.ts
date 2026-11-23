import { defineSecret } from 'firebase-functions/params';

/** Resend API key — set before deploy: firebase functions:secrets:set RESEND_API_KEY */
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

/**
 * Google Geocoding API key (server-only).
 * Console: enable "Geocoding API", restrict key to that API, store via:
 *   firebase functions:secrets:set GOOGLE_GEOCODING_API_KEY
 */
export const GOOGLE_GEOCODING_API_KEY = defineSecret('GOOGLE_GEOCODING_API_KEY');
