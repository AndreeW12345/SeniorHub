import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

type RateLimitOptions = {
  /** Firestore doc path used to track attempts, e.g. security/deleteAccount/{uid}. */
  docPath: string;
  /** Minimum milliseconds between allowed calls. */
  cooldownMs: number;
};

/**
 * Simple per-user cooldown stored in Firestore. Fails closed when the check cannot run.
 */
export async function assertRateLimit(options: RateLimitOptions): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(options.docPath);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const lastAttemptMs = snapshot.data()?.lastAttemptMs;

    if (typeof lastAttemptMs === 'number' && now - lastAttemptMs < options.cooldownMs) {
      throw new HttpsError(
        'resource-exhausted',
        'För många försök. Vänta en stund och försök igen.',
      );
    }

    transaction.set(
      ref,
      {
        lastAttemptMs: now,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

type RateLimitWindowOptions = {
  docPath: string;
  windowMs: number;
  maxAttempts: number;
};

/** Limits how many attempts are allowed within a sliding time window. */
export async function assertRateLimitWindow(options: RateLimitWindowOptions): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(options.docPath);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const previousAttempts = snapshot.data()?.attempts;
    const attempts = Array.isArray(previousAttempts)
      ? previousAttempts.filter(
          (value): value is number =>
            typeof value === 'number' && now - value < options.windowMs,
        )
      : [];

    if (attempts.length >= options.maxAttempts) {
      throw new HttpsError(
        'resource-exhausted',
        'För många försök. Vänta en stund och försök igen.',
      );
    }

    attempts.push(now);
    transaction.set(
      ref,
      {
        attempts,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}
