import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

const REGISTRATIONS_STORAGE_KEY = '@seniorhub/registrations';

export type LocalRegistrationStatus = 'registered' | 'waitlist';

export type LocalRegistration = {
  activityId: string;
  /** Firestore registration document id when booked via SeniorHub. */
  registrationId?: string;
  status?: LocalRegistrationStatus;
};

type RegistrationsContextValue = {
  registeredActivityIds: string[];
  isLoading: boolean;
  isRegistered: (activityId: string) => boolean;
  isOnWaitlist: (activityId: string) => boolean;
  getRegistrationId: (activityId: string) => string | null;
  markAsRegistered: (activityId: string, registrationId?: string) => void;
  markAsWaitlisted: (activityId: string, registrationId?: string) => void;
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
          return { activityId: item.trim(), status: 'registered' };
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

          const statusValue = (item as { status?: unknown }).status;
          const status: LocalRegistrationStatus =
            statusValue === 'waitlist' ? 'waitlist' : 'registered';

          return { activityId, registrationId, status };
        }

        return null;
      })
      .filter((item): item is LocalRegistration => item !== null);
  } catch {
    return [];
  }
}

function upsertLocalRegistration(
  current: LocalRegistration[],
  activityId: string,
  status: LocalRegistrationStatus,
  registrationId?: string,
): LocalRegistration[] {
  const existingIndex = current.findIndex((registration) => registration.activityId === activityId);

  if (existingIndex >= 0) {
    return current.map((registration, index) =>
      index === existingIndex
        ? {
            activityId,
            status,
            registrationId: registrationId ?? registration.registrationId,
          }
        : registration,
    );
  }

  return [...current, { activityId, status, registrationId }];
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
    () =>
      localRegistrations
        .filter((registration) => (registration.status ?? 'registered') === 'registered')
        .map((registration) => registration.activityId),
    [localRegistrations],
  );

  const isRegistered = useCallback(
    (activityId: string) =>
      localRegistrations.some(
        (registration) =>
          registration.activityId === activityId &&
          (registration.status ?? 'registered') === 'registered',
      ),
    [localRegistrations],
  );

  const isOnWaitlist = useCallback(
    (activityId: string) =>
      localRegistrations.some(
        (registration) =>
          registration.activityId === activityId && registration.status === 'waitlist',
      ),
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
        const next = upsertLocalRegistration(
          current,
          trimmedActivityId,
          'registered',
          trimmedRegistrationId,
        );
        void persistRegistrations(next);
        return next;
      });
    },
    [persistRegistrations],
  );

  const markAsWaitlisted = useCallback(
    (activityId: string, registrationId?: string) => {
      const trimmedActivityId = activityId.trim();
      if (!trimmedActivityId) {
        return;
      }

      const trimmedRegistrationId = registrationId?.trim() || undefined;

      setLocalRegistrations((current) => {
        const next = upsertLocalRegistration(
          current,
          trimmedActivityId,
          'waitlist',
          trimmedRegistrationId,
        );
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

  // When this device is on a waitlist and gets auto-promoted, update local UI to "registered".
  const waitlistSyncKey = useMemo(
    () =>
      localRegistrations
        .filter(
          (registration) =>
            registration.status === 'waitlist' &&
            typeof registration.registrationId === 'string' &&
            registration.registrationId.trim().length > 0,
        )
        .map((registration) => `${registration.activityId}:${registration.registrationId}`)
        .sort()
        .join('|'),
    [localRegistrations],
  );

  useEffect(() => {
    if (!waitlistSyncKey || !isFirebaseConfigured()) {
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      return;
    }

    const entries = waitlistSyncKey.split('|').map((entry) => {
      const [activityId, registrationId] = entry.split(':');
      return { activityId, registrationId };
    });

    const unsubscribers = entries.map(({ activityId, registrationId }) =>
      onSnapshot(
        doc(
          db,
          FIRESTORE_COLLECTIONS.activities,
          activityId,
          FIRESTORE_COLLECTIONS.registrations,
          registrationId,
        ),
        (snapshot) => {
          if (!snapshot.exists()) {
            removeRegistration(activityId);
            return;
          }

          const status = snapshot.data()?.status;
          if (status === 'registered') {
            markAsRegistered(activityId, registrationId);
          } else if (status === 'cancelled') {
            removeRegistration(activityId);
          }
        },
        (error) => {
          console.warn('[SeniorHub] Kunde inte synka reservlistestatus:', error);
        },
      ),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [waitlistSyncKey, markAsRegistered, removeRegistration]);

  const value = useMemo(
    () => ({
      registeredActivityIds,
      isLoading,
      isRegistered,
      isOnWaitlist,
      getRegistrationId,
      markAsRegistered,
      markAsWaitlisted,
      removeRegistration,
    }),
    [
      registeredActivityIds,
      isLoading,
      isRegistered,
      isOnWaitlist,
      getRegistrationId,
      markAsRegistered,
      markAsWaitlisted,
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
