import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  subscribeMyActivityRegistration,
  type MyActivityRegistrationStatus,
} from '@/services/registrations/subscribe-my-activity-registration';

const REGISTRATIONS_STORAGE_PREFIX = '@seniorhub/registrations/';

export type LocalRegistrationStatus = 'registered' | 'waitlist';

export type LocalRegistration = {
  activityId: string;
  /** Firestore registration document id when booked via SeniorHub (equals auth uid). */
  registrationId?: string;
  status?: LocalRegistrationStatus;
};

type RegistrationsContextValue = {
  registeredActivityIds: string[];
  /** Bookings for the signed-in user on this device. */
  localBookings: LocalRegistration[];
  isLoading: boolean;
  isRegistered: (activityId: string) => boolean;
  isOnWaitlist: (activityId: string) => boolean;
  /** Returns the current user's uid when they are booked/waitlisted on the activity. */
  getRegistrationId: (activityId: string) => string | null;
  /** Ensures a Firestore listener exists for the user's registration on this activity. */
  watchActivityRegistration: (activityId: string) => void;
  markAsRegistered: (activityId: string, registrationId?: string) => void;
  markAsWaitlisted: (activityId: string, registrationId?: string) => void;
  removeRegistration: (activityId: string) => void;
};

const RegistrationsContext = createContext<RegistrationsContextValue | null>(null);

function getRegistrationsStorageKey(uid: string): string {
  return `${REGISTRATIONS_STORAGE_PREFIX}${uid}`;
}

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
  const { user } = useAuth();
  const uid = user?.uid?.trim() ?? null;

  const [localRegistrations, setLocalRegistrations] = useState<LocalRegistration[]>([]);
  const [remoteStatusByActivity, setRemoteStatusByActivity] = useState<
    Record<string, MyActivityRegistrationStatus | undefined>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const watchedActivitiesRef = useRef<Set<string>>(new Set());
  const listenerUnsubsRef = useRef<Map<string, () => void>>(new Map());

  const clearRegistrationListeners = useCallback(() => {
    listenerUnsubsRef.current.forEach((unsubscribe) => unsubscribe());
    listenerUnsubsRef.current.clear();
    watchedActivitiesRef.current.clear();
  }, []);

  useEffect(() => {
    let isMounted = true;

    clearRegistrationListeners();
    setRemoteStatusByActivity({});

    if (!uid) {
      setLocalRegistrations([]);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const activeUid = uid;
    setIsLoading(true);

    async function loadRegistrations() {
      try {
        const stored = await AsyncStorage.getItem(getRegistrationsStorageKey(activeUid));

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
      clearRegistrationListeners();
    };
  }, [uid, clearRegistrationListeners]);

  const persistRegistrations = useCallback(
    async (registrations: LocalRegistration[], ownerUid: string) => {
      await AsyncStorage.setItem(
        getRegistrationsStorageKey(ownerUid),
        JSON.stringify(registrations),
      );
    },
    [],
  );

  const removeRegistrationForUid = useCallback(
    (activityId: string, ownerUid: string) => {
      setLocalRegistrations((current) => {
        const next = current.filter((registration) => registration.activityId !== activityId);
        void persistRegistrations(next, ownerUid);
        return next;
      });
    },
    [persistRegistrations],
  );

  const watchActivityRegistration = useCallback(
    (activityId: string) => {
      const trimmedActivityId = activityId.trim();
      if (!uid || !trimmedActivityId) {
        return;
      }

      if (watchedActivitiesRef.current.has(trimmedActivityId)) {
        return;
      }

      watchedActivitiesRef.current.add(trimmedActivityId);

      const unsubscribe = subscribeMyActivityRegistration(
        trimmedActivityId,
        uid,
        (status) => {
          setRemoteStatusByActivity((current) => ({
            ...current,
            [trimmedActivityId]: status,
          }));

          if (status === null) {
            removeRegistrationForUid(trimmedActivityId, uid);
            return;
          }

          if (status === 'registered') {
            setLocalRegistrations((current) => {
              const next = upsertLocalRegistration(current, trimmedActivityId, 'registered', uid);
              void persistRegistrations(next, uid);
              return next;
            });
            return;
          }

          if (status === 'waitlist') {
            setLocalRegistrations((current) => {
              const next = upsertLocalRegistration(current, trimmedActivityId, 'waitlist', uid);
              void persistRegistrations(next, uid);
              return next;
            });
          }
        },
      );

      listenerUnsubsRef.current.set(trimmedActivityId, unsubscribe);
    },
    [uid, persistRegistrations, removeRegistrationForUid],
  );

  useEffect(() => {
    if (!uid) {
      return;
    }

    for (const registration of localRegistrations) {
      watchActivityRegistration(registration.activityId);
    }
  }, [uid, localRegistrations, watchActivityRegistration]);

  const registeredActivityIds = useMemo(
    () =>
      localRegistrations
        .filter((registration) => {
          const remote = remoteStatusByActivity[registration.activityId];
          if (remote === 'registered') {
            return true;
          }
          if (remote === 'waitlist' || remote === null) {
            return false;
          }
          return (registration.status ?? 'registered') === 'registered';
        })
        .map((registration) => registration.activityId),
    [localRegistrations, remoteStatusByActivity],
  );

  const localBookings = useMemo(
    () =>
      localRegistrations
        .filter((registration) => {
          const remote = remoteStatusByActivity[registration.activityId];
          if (remote === null) {
            return false;
          }
          if (remote === 'registered' || remote === 'waitlist') {
            return true;
          }
          return remote === undefined;
        })
        .map((registration) => ({
          ...registration,
          status: (registration.status ?? 'registered') as LocalRegistrationStatus,
        })),
    [localRegistrations, remoteStatusByActivity],
  );

  const isRegistered = useCallback(
    (activityId: string) => {
      const trimmedActivityId = activityId.trim();
      if (!uid || !trimmedActivityId) {
        return false;
      }

      const remote = remoteStatusByActivity[trimmedActivityId];
      if (remote === 'registered') {
        return true;
      }
      if (remote === 'waitlist' || remote === null) {
        return false;
      }

      const local = localRegistrations.find(
        (registration) => registration.activityId === trimmedActivityId,
      );
      return (local?.status ?? 'registered') === 'registered';
    },
    [localRegistrations, remoteStatusByActivity, uid],
  );

  const isOnWaitlist = useCallback(
    (activityId: string) => {
      const trimmedActivityId = activityId.trim();
      if (!uid || !trimmedActivityId) {
        return false;
      }

      const remote = remoteStatusByActivity[trimmedActivityId];
      if (remote === 'waitlist') {
        return true;
      }
      if (remote === 'registered' || remote === null) {
        return false;
      }

      const local = localRegistrations.find(
        (registration) => registration.activityId === trimmedActivityId,
      );
      return local?.status === 'waitlist';
    },
    [localRegistrations, remoteStatusByActivity, uid],
  );

  const getRegistrationId = useCallback(
    (activityId: string) => {
      if (!uid) {
        return null;
      }

      if (isRegistered(activityId) || isOnWaitlist(activityId)) {
        return uid;
      }

      return null;
    },
    [isOnWaitlist, isRegistered, uid],
  );

  const markAsRegistered = useCallback(
    (activityId: string, registrationId?: string) => {
      const trimmedActivityId = activityId.trim();
      if (!trimmedActivityId || !uid) {
        return;
      }

      const trimmedRegistrationId = registrationId?.trim() || uid;

      setLocalRegistrations((current) => {
        const next = upsertLocalRegistration(
          current,
          trimmedActivityId,
          'registered',
          trimmedRegistrationId,
        );
        void persistRegistrations(next, uid);
        return next;
      });

      setRemoteStatusByActivity((current) => ({
        ...current,
        [trimmedActivityId]: 'registered',
      }));
      watchActivityRegistration(trimmedActivityId);
    },
    [persistRegistrations, uid, watchActivityRegistration],
  );

  const markAsWaitlisted = useCallback(
    (activityId: string, registrationId?: string) => {
      const trimmedActivityId = activityId.trim();
      if (!trimmedActivityId || !uid) {
        return;
      }

      const trimmedRegistrationId = registrationId?.trim() || uid;

      setLocalRegistrations((current) => {
        const next = upsertLocalRegistration(
          current,
          trimmedActivityId,
          'waitlist',
          trimmedRegistrationId,
        );
        void persistRegistrations(next, uid);
        return next;
      });

      setRemoteStatusByActivity((current) => ({
        ...current,
        [trimmedActivityId]: 'waitlist',
      }));
      watchActivityRegistration(trimmedActivityId);
    },
    [persistRegistrations, uid, watchActivityRegistration],
  );

  const removeRegistration = useCallback(
    (activityId: string) => {
      const trimmedActivityId = activityId.trim();
      if (!trimmedActivityId || !uid) {
        return;
      }

      removeRegistrationForUid(trimmedActivityId, uid);
      setRemoteStatusByActivity((current) => ({
        ...current,
        [trimmedActivityId]: null,
      }));
    },
    [removeRegistrationForUid, uid],
  );

  const value = useMemo(
    () => ({
      registeredActivityIds,
      localBookings,
      isLoading,
      isRegistered,
      isOnWaitlist,
      getRegistrationId,
      watchActivityRegistration,
      markAsRegistered,
      markAsWaitlisted,
      removeRegistration,
    }),
    [
      registeredActivityIds,
      localBookings,
      isLoading,
      isRegistered,
      isOnWaitlist,
      getRegistrationId,
      watchActivityRegistration,
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
