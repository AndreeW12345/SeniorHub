export async function fetchFcmRegistrationToken(): Promise<string | null> {
  return null;
}

export function subscribeFcmTokenRefresh(_listener: (token: string) => void): () => void {
  return () => {};
}
