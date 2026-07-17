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

export type LocalRegistration = {
  activityId: string;
  /** Firestore registration document id when booked via SeniorHub. */
  registrationId?: string;
};

type RegistrationsContextValue = {
  registeredActivityIds: string[];
  isLoading: boolean;
  isRegistered: (activityId: string) => boolean;
  getRegistrationId: (activityId: string) => string | null;
  markAsRegistered: (activityId: string, registrationId?: string) => void;
  removeRegistration: (activityId: string) => void;
};

const RegistrationsContext = createContext<RegistrationsContextValue | null>(null);

function parseStoredRegistrations(value: string | null): LocalRegistration[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item): LocalRegistration | null => {
        if (typeof item === 'string' && item.trim().length > 0) {
          return { activityId: item.trim() };
        }

        if (
          item &&
          typeof item === 'object' &&
          'activityId' in item &&
          typeof (item as { activityId: unknown }).activityId === 'string'
        ) {
          const activityId = (item as { activityId: string }).activityId.trim();
          if (!activityId) {
            return null;
          }

          const registrationIdValue = (item as { registrationId?: unknown }).registrationId;
          const registrationId =
            typeof registrationIdValue === 'string' && registrationIdValue.trim().length > 0
              ? registrationIdValue.trim()
              : undefined;

          return { activityId, registrationId };
        }

        return null;
      })
      .filter((item): item is LocalRegistration => item !== null);
  } catch {
    return [];
  }
}

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const [localRegistrations, setLocalRegistrations] = useState<LocalRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrations() {
      try {
        const stored = await AsyncStorage.getItem(REGISTRATIONS_STORAGE_KEY);

        if (isMounted) {
          setLocalRegistrations(parseStoredRegistrations(stored));
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

  const persistRegistrations = useCallback(async (registrations: LocalRegistration[]) => {
    await AsyncStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
  }, []);

  const registeredActivityIds = useMemo(
    () => localRegistrations.map((registration) => registration.activityId),
    [localRegistrations],
  );

  const isRegistered = useCallback(
    (activityId: string) =>
      localRegistrations.some((registration) => registration.activityId === activityId),
    [localRegistrations],
  );

  const getRegistrationId = useCallback(
    (activityId: string) => {
      const match = localRegistrations.find((registration) => registration.activityId === activityId);
      return match?.registrationId?.trim() || null;
    },
    [localRegistrations],
  );

  const markAsRegistered = useCallback(
    (activityId: string, registrationId?: string) => {
      const trimmedActivityId = activityId.trim();
      if (!trimmedActivityId) {
        return;
      }

      const trimmedRegistrationId = registrationId?.trim() || undefined;

      setLocalRegistrations((current) => {
        const existingIndex = current.findIndex(
          (registration) => registration.activityId === trimmedActivityId,
        );

        let next: LocalRegistration[];

        if (existingIndex >= 0) {
          next = current.map((registration, index) =>
            index === existingIndex
              ? {
                  activityId: trimmedActivityId,
                  registrationId: trimmedRegistrationId ?? registration.registrationId,
                }
              : registration,
          );
        } else {
          next = [
            ...current,
            { activityId: trimmedActivityId, registrationId: trimmedRegistrationId },
          ];
        }

        void persistRegistrations(next);
        return next;
      });
    },
    [persistRegistrations],
  );

  const removeRegistration = useCallback(
    (activityId: string) => {
      setLocalRegistrations((current) => {
        const next = current.filter((registration) => registration.activityId !== activityId);
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
      getRegistrationId,
      markAsRegistered,
      removeRegistration,
    }),
    [
      registeredActivityIds,
      isLoading,
      isRegistered,
      getRegistrationId,
      markAsRegistered,
      removeRegistration,
    ],
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
