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

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '@/constants/notification-preferences';

const PREFERENCES_STORAGE_KEY = '@seniorhub/notification-preferences';

type NotificationPreferencesContextValue = {
  preferences: NotificationPreferences;
  isLoading: boolean;
  setPreference: (key: NotificationPreferenceKey, value: boolean) => void;
};

const NotificationPreferencesContext =
  createContext<NotificationPreferencesContextValue | null>(null);

function parseStoredPreferences(value: string | null): NotificationPreferences {
  if (!value) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    const record = parsed as Record<string, unknown>;

    return {
      dayBefore:
        typeof record.dayBefore === 'boolean'
          ? record.dayBefore
          : DEFAULT_NOTIFICATION_PREFERENCES.dayBefore,
      oneHourBefore:
        typeof record.oneHourBefore === 'boolean'
          ? record.oneHourBefore
          : DEFAULT_NOTIFICATION_PREFERENCES.oneHourBefore,
      activityUpdates:
        typeof record.activityUpdates === 'boolean'
          ? record.activityUpdates
          : DEFAULT_NOTIFICATION_PREFERENCES.activityUpdates,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

/** Local notification reminder preferences (AsyncStorage). */
export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (isMounted) {
          setPreferences(parseStoredPreferences(stored));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPreferences = useCallback(async (next: NotificationPreferences) => {
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setPreference = useCallback(
    (key: NotificationPreferenceKey, value: boolean) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        void persistPreferences(next);
        return next;
      });
    },
    [persistPreferences],
  );

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      setPreference,
    }),
    [preferences, isLoading, setPreference],
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);

  if (!context) {
    throw new Error(
      'useNotificationPreferences måste användas inom NotificationPreferencesProvider',
    );
  }

  return context;
}
