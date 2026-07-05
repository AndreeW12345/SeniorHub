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
  filterActivities as filterActivitiesList,
  getActivitiesByIds as pickActivitiesByIds,
  getActivityById as pickActivityById,
  type Activity,
  type Category,
} from '@/constants/activities';
import { SAMPLE_ACTIVITIES } from '@/constants/sample-activities';
import { isFirebaseConfigured } from '@/firebase/config';
import { fetchActivitiesFromFirestore, verifyFirestoreConnection } from '@/services/activities';

type ActivitiesContextValue = {
  activities: Activity[];
  isLoading: boolean;
  getActivityById: (id: string) => Activity | undefined;
  getActivitiesByIds: (ids: string[]) => Activity[];
  filterActivities: (query: string, category: Category) => Activity[];
  refreshActivities: () => Promise<void>;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

function getDevelopmentSampleActivities(): Activity[] {
  return __DEV__ && !isFirebaseConfigured() ? SAMPLE_ACTIVITIES : [];
}

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshActivities = useCallback(async () => {
    try {
      if (!isFirebaseConfigured()) {
        setActivities(getDevelopmentSampleActivities());
        return;
      }

      const remoteActivities = await fetchActivitiesFromFirestore();
      setActivities(remoteActivities);
    } catch (error) {
      console.warn('Kunde inte uppdatera aktiviteter från Firestore:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      setIsLoading(true);

      try {
        if (!isFirebaseConfigured()) {
          if (__DEV__) {
            console.info('[SeniorHub] Firebase ej konfigurerat – visar exempelaktiviteter.');
          }

          if (isMounted) {
            setActivities(getDevelopmentSampleActivities());
          }

          return;
        }

        if (__DEV__) {
          const status = await verifyFirestoreConnection();

          if (!status.connected) {
            console.warn('[SeniorHub] Firestore-anslutning misslyckades:', status.errorMessage);
          } else {
            console.info(
              `[SeniorHub] Firestore OK – ${status.documentCount} aktivitet(er) i databasen.`,
            );
          }
        }

        const remoteActivities = await fetchActivitiesFromFirestore();

        if (isMounted) {
          setActivities(remoteActivities);
        }
      } catch (error) {
        console.warn('Kunde inte ladda aktiviteter från Firestore:', error);

        if (isMounted) {
          setActivities([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const getActivityById = useCallback(
    (id: string) => pickActivityById(activities, id),
    [activities],
  );

  const getActivitiesByIds = useCallback(
    (ids: string[]) => pickActivitiesByIds(activities, ids),
    [activities],
  );

  const filterActivities = useCallback(
    (query: string, category: Category) => filterActivitiesList(activities, query, category),
    [activities],
  );

  const value = useMemo(
    () => ({
      activities,
      isLoading,
      getActivityById,
      getActivitiesByIds,
      filterActivities,
      refreshActivities,
    }),
    [activities, isLoading, getActivityById, getActivitiesByIds, filterActivities, refreshActivities],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const context = useContext(ActivitiesContext);

  if (!context) {
    throw new Error('useActivities måste användas inom ActivitiesProvider');
  }

  return context;
}
