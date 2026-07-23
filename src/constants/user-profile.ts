/** End-user profile stored on Firestore `users/{deviceId}`. */
export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  photoUrl: string | null;
};

export const EMPTY_USER_PROFILE: UserProfile = {
  name: '',
  phone: '',
  email: '',
  photoUrl: null,
};

export type UserProfileUpdate = {
  name: string;
  phone: string;
  email: string;
  photoUrl?: string | null;
};
