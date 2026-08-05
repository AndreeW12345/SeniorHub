import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { EMPTY_USER_PROFILE, type UserProfile, type UserProfileUpdate } from '@/constants/user-profile';
import { useAuth } from '@/contexts/auth-context';
import {
  clearUserProfileFields,
  fetchUserProfile,
  migrateDeviceProfileToUid,
  saveUserProfile,
} from '@/services/profile';

const PROFILE_CACHE_KEY = '@seniorhub/user-profile';

type UserProfileContextValue = {
  profile: UserProfile;
  /** Firebase Auth UID used as Firestore `users/{uid}` document id, or null when signed out. */
  userId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    update: UserProfileUpdate,
  ) => Promise<{ ok: true } | { ok: false; errorMessage: string }>;
  deleteProfile: () => Promise<{ ok: true } | { ok: false; errorMessage: string }>;
  /** Clears only the local AsyncStorage profile cache (not Firestore). */
  clearLocalProfileCache: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function parseCachedProfile(value: string | null): UserProfile | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    return {
      name: typeof record.name === 'string' ? record.name : '',
      phone: typeof record.phone === 'string' ? record.phone : '',
      email: typeof record.email === 'string' ? record.email : '',
      photoUrl: typeof record.photoUrl === 'string' && record.photoUrl ? record.photoUrl : null,
    };
  } catch {
    return null;
  }
}

async function cacheProfile(profile: UserProfile) {
  await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

/** Loads and persists the signed-in user's profile from Firestore `users/{uid}`. */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid?.trim() || null;
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_USER_PROFILE });
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      const empty = { ...EMPTY_USER_PROFILE };
      setProfile(empty);
      return;
    }

    const migration = await migrateDeviceProfileToUid(userId);
    if (migration.ok) {
      setProfile(migration.profile);
      await cacheProfile(migration.profile);

      if (migration.migrated) {
        return;
      }
    }

    const result = await fetchUserProfile(userId);
    if (result.ok) {
      setProfile(result.profile);
      await cacheProfile(result.profile);
      return;
    }

    const cached = parseCachedProfile(await AsyncStorage.getItem(PROFILE_CACHE_KEY));
    if (cached) {
      setProfile(cached);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        if (!userId) {
          if (isMounted) {
            setProfile({ ...EMPTY_USER_PROFILE });
          }
          return;
        }

        const cached = parseCachedProfile(await AsyncStorage.getItem(PROFILE_CACHE_KEY));
        if (isMounted && cached) {
          setProfile(cached);
        }

        await refreshProfile();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [refreshProfile, userId]);

  const updateProfile = useCallback(
    async (update: UserProfileUpdate) => {
      if (!userId) {
        return { ok: false as const, errorMessage: 'Logga in för att spara din profil.' };
      }

      const result = await saveUserProfile(userId, update);
      if (!result.ok) {
        return result;
      }

      const nextProfile: UserProfile = {
        name: result.profile.name,
        phone: result.profile.phone,
        email: result.profile.email,
        photoUrl:
          update.photoUrl === undefined ? profile.photoUrl : result.profile.photoUrl,
      };

      setProfile(nextProfile);
      await cacheProfile(nextProfile);
      return { ok: true as const };
    },
    [userId, profile.photoUrl],
  );

  const deleteProfile = useCallback(async () => {
    if (!userId) {
      return { ok: false as const, errorMessage: 'Logga in för att ta bort din profil.' };
    }

    const result = await clearUserProfileFields(userId);
    if (!result.ok) {
      return result;
    }

    const empty = { ...EMPTY_USER_PROFILE };
    setProfile(empty);
    await cacheProfile(empty);
    return { ok: true as const };
  }, [userId]);

  const clearLocalProfileCache = useCallback(async () => {
    const empty = { ...EMPTY_USER_PROFILE };
    setProfile(empty);
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      userId,
      isLoading,
      refreshProfile,
      updateProfile,
      deleteProfile,
      clearLocalProfileCache,
    }),
    [
      profile,
      userId,
      isLoading,
      refreshProfile,
      updateProfile,
      deleteProfile,
      clearLocalProfileCache,
    ],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile måste användas inom UserProfileProvider');
  }
  return context;
}
