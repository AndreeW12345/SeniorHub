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
  NOTIFICATION_TYPES,
  type AppNotification,
  type CreateNotificationInput,
  type NotificationType,
} from '@/constants/notifications';
import { sortNotificationsNewestFirst } from '@/utils/notifications';

const NOTIFICATIONS_STORAGE_KEY = '@seniorhub/notifications';

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (input: CreateNotificationInput) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && NOTIFICATION_TYPES.includes(value as NotificationType);
}

function parseStoredNotifications(value: string | null): AppNotification[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item): AppNotification | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as Record<string, unknown>;
        const id = typeof record.id === 'string' ? record.id.trim() : '';
        const icon = typeof record.icon === 'string' ? record.icon : '';
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        const description =
          typeof record.description === 'string' ? record.description.trim() : '';
        const createdAt = typeof record.createdAt === 'string' ? record.createdAt : '';
        const read = record.read === true;
        const type = isNotificationType(record.type) ? record.type : null;

        if (!id || !icon || !title || !description || !createdAt || !type) {
          return null;
        }

        const parsedDate = new Date(createdAt);
        if (Number.isNaN(parsedDate.getTime())) {
          return null;
        }

        return { id, icon, title, description, createdAt, read, type };
      })
      .filter((item): item is AppNotification => item !== null);
  } catch {
    return [];
  }
}

function createNotificationId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Local notifications store (AsyncStorage). Ready for a later Firestore sync. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (isMounted) {
          setNotifications(sortNotificationsNewestFirst(parseStoredNotifications(stored)));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistNotifications = useCallback(async (next: AppNotification[]) => {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addNotification = useCallback(
    (input: CreateNotificationInput) => {
      const nextNotification: AppNotification = {
        id: createNotificationId(),
        icon: input.icon,
        title: input.title.trim(),
        description: input.description.trim(),
        createdAt: new Date().toISOString(),
        read: false,
        type: input.type,
      };

      setNotifications((current) => {
        const next = sortNotificationsNewestFirst([nextNotification, ...current]);
        void persistNotifications(next);
        return next;
      });
    },
    [persistNotifications],
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      const trimmedId = notificationId.trim();
      if (!trimmedId) {
        return;
      }

      setNotifications((current) => {
        const next = current.map((notification) =>
          notification.id === trimmedId ? { ...notification, read: true } : notification,
        );
        void persistNotifications(next);
        return next;
      });
    },
    [persistNotifications],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => {
      if (current.every((notification) => notification.read)) {
        return current;
      }

      const next = current.map((notification) =>
        notification.read ? notification : { ...notification, read: true },
      );
      void persistNotifications(next);
      return next;
    });
  }, [persistNotifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications((current) => {
      if (current.length === 0) {
        return current;
      }

      void persistNotifications([]);
      return [];
    });
  }, [persistNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications måste användas inom NotificationsProvider');
  }

  return context;
}
