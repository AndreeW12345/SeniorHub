/**
 * Platform implementations live in messaging.web.ts and messaging.native.ts.
 * Metro resolves the correct module per platform.
 */
export async function fetchFcmRegistrationToken(): Promise<string | null> {
  return null;
}

export function subscribeFcmTokenRefresh(_listener: (token: string) => void): () => void {
  return () => {};
}
