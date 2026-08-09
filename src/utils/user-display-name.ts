import type { User } from 'firebase/auth';

import type { UserProfile } from '@/constants/user-profile';

/** First name for personalized greetings (profile name, then e-post, then fallback). */
export function getUserFirstName(profile: UserProfile, user: User | null): string {
  const name = profile.name.trim();
  if (name) {
    return name.split(/\s+/)[0] ?? name;
  }

  const email = profile.email.trim() || user?.email?.trim() || '';
  if (email) {
    const localPart = email.split('@')[0]?.trim();
    if (localPart) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  }

  return 'du';
}
