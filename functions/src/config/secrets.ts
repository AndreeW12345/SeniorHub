import { defineSecret } from 'firebase-functions/params';

/** Resend API key — set before deploy: firebase functions:secrets:set RESEND_API_KEY */
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
