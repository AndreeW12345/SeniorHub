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
import { getOrCreateDeviceId } from '@/services/notifications';
import {
  clearUserProfileFields,
  fetchUserProfile,
  saveUserProfile,
} from '@/services/profile';

const PROFILE_CACHE_KEY = '@seniorhub/user-profile';

type UserProfileContextValue = {
  profile: UserProfile;
  deviceId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    update: UserProfileUpdate,
  ) => Promise<{ ok: true } | { ok: false; errorMessage: string }>;
  deleteProfile: () => Promise<{ ok: true } | { ok: false; errorMessage: string }>;
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

/** Loads and persists the device user's profile from Firestore. */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_USER_PROFILE });
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const id = await getOrCreateDeviceId();
    setDeviceId(id);

    const result = await fetchUserProfile(id);
    if (result.ok) {
      setProfile(result.profile);
      await cacheProfile(result.profile);
      return;
    }

    const cached = parseCachedProfile(await AsyncStorage.getItem(PROFILE_CACHE_KEY));
    if (cached) {
      setProfile(cached);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
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
  }, [refreshProfile]);

  const updateProfile = useCallback(
    async (update: UserProfileUpdate) => {
      const id = deviceId ?? (await getOrCreateDeviceId());
      if (!deviceId) {
        setDeviceId(id);
      }

      const result = await saveUserProfile(id, update);
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
    [deviceId, profile.photoUrl],
  );

  const deleteProfile = useCallback(async () => {
    const id = deviceId ?? (await getOrCreateDeviceId());
    const result = await clearUserProfileFields(id);
    if (!result.ok) {
      return result;
    }

    const empty = { ...EMPTY_USER_PROFILE };
    setProfile(empty);
    await cacheProfile(empty);
    return { ok: true as const };
  }, [deviceId]);

  const value = useMemo(
    () => ({
      profile,
      deviceId,
      isLoading,
      refreshProfile,
      updateProfile,
      deleteProfile,
    }),
    [profile, deviceId, isLoading, refreshProfile, updateProfile, deleteProfile],
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
