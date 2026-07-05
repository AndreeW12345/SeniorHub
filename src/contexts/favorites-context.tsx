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

import { useActivities } from '@/contexts/activities-context';

const FAVORITES_STORAGE_KEY = '@seniorhub/favorites';

type FavoritesContextValue = {
  favoriteIds: string[];
  isLoading: boolean;
  isFavorite: (activityId: string) => boolean;
  toggleFavorite: (activityId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Parses stored favorite ids without validating against the activity list. */
function parseStoredFavoriteIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { activities } = useActivities();
  const [storedFavoriteIds, setStoredFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const validActivityIds = useMemo(
    () => new Set(activities.map((activity) => activity.id)),
    [activities],
  );

  const favoriteIds = useMemo(
    () => storedFavoriteIds.filter((id) => validActivityIds.has(id)),
    [storedFavoriteIds, validActivityIds],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadFavorites() {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (isMounted) {
          setStoredFavoriteIds(parseStoredFavoriteIds(stored));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistFavorites = useCallback(async (ids: string[]) => {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggleFavorite = useCallback(
    (activityId: string) => {
      if (!validActivityIds.has(activityId)) {
        return;
      }

      setStoredFavoriteIds((current) => {
        const next = current.includes(activityId)
          ? current.filter((id) => id !== activityId)
          : [...current, activityId];

        void persistFavorites(next);
        return next;
      });
    },
    [persistFavorites, validActivityIds],
  );

  const isFavorite = useCallback(
    (activityId: string) => favoriteIds.includes(activityId),
    [favoriteIds],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      isLoading,
      isFavorite,
      toggleFavorite,
    }),
    [favoriteIds, isLoading, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites måste användas inom FavoritesProvider');
  }

  return context;
}
