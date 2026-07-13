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

const REGISTRATIONS_STORAGE_KEY = '@seniorhub/registrations';

type RegistrationsContextValue = {
  registeredActivityIds: string[];
  isLoading: boolean;
  isRegistered: (activityId: string) => boolean;
  markAsRegistered: (activityId: string) => void;
  removeRegistration: (activityId: string) => void;
};

const RegistrationsContext = createContext<RegistrationsContextValue | null>(null);

function parseStoredRegistrations(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const [registeredActivityIds, setRegisteredActivityIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrations() {
      try {
        const stored = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);

        if (isMounted) {
          setRegisteredActivityIds(parseStoredRegistrations(stored));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRegistrations();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistRegistrations = useCallback(async (activityIds: string[]) => {
    await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(activityIds));
  }, []);

  const isRegistered = useCallback(
    (activityId: string) => registeredActivityIds.includes(activityId),
    [registeredActivityIds],
  );

  const markAsRegistered = useCallback(
    (activityId: string) => {
      const trimmed = activityId.trim();
      if (!trimmed) {
        return;
      }

      setRegisteredActivityIds((current) => {
        if (current.includes(trimmed)) {
          return current;
        }

        const next = [...current, trimmed];
        void persistRegistrations(next);
        return next;
      });
    },
    [persistRegistrations],
  );

  const removeRegistration = useCallback(
    (activityId: string) => {
      setRegisteredActivityIds((current) => {
        const next = current.filter((id) => id !== activityId);
        void persistRegistrations(next);
        return next;
      });
    },
    [persistRegistrations],
  );

  const value = useMemo(
    () => ({
      registeredActivityIds,
      isLoading,
      isRegistered,
      markAsRegistered,
      removeRegistration,
    }),
    [registeredActivityIds, isLoading, isRegistered, markAsRegistered, removeRegistration],
  );

  return <RegistrationsContext.Provider value={value}>{children}</RegistrationsContext.Provider>;
}

export function useRegistrations() {
  const context = useContext(RegistrationsContext);

  if (!context) {
    throw new Error('useRegistrations måste användas inom RegistrationsProvider');
  }

  return context;
}
