import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { findOrganizerBySlug, type Organizer } from '@/constants/organizers';
import { SAMPLE_ORGANIZERS } from '@/constants/sample-organizers';
import { isFirebaseConfigured } from '@/firebase/config';
import { fetchOrganizersFromFirestore } from '@/services/organizers';

type OrganizersContextValue = {
  organizers: Organizer[];
  isLoading: boolean;
  getOrganizerBySlug: (slug: string) => Organizer | undefined;
};

const OrganizersContext = createContext<OrganizersContextValue | null>(null);

function getDevelopmentSampleOrganizers(): Organizer[] {
  return __DEV__ && !isFirebaseConfigured() ? SAMPLE_ORGANIZERS : [];
}

export function OrganizersProvider({ children }: { children: ReactNode }) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganizers() {
      setIsLoading(true);

      try {
        if (!isFirebaseConfigured()) {
          if (isMounted) {
            setOrganizers(getDevelopmentSampleOrganizers());
          }

          return;
        }

        const remoteOrganizers = await fetchOrganizersFromFirestore();

        if (isMounted) {
          setOrganizers(remoteOrganizers);
        }
      } catch (error) {
        console.warn('Kunde inte ladda arrangörer från Firestore:', error);

        if (isMounted) {
          setOrganizers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganizers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getOrganizerBySlug = useCallback(
    (slug: string) => findOrganizerBySlug(organizers, slug),
    [organizers],
  );

  const value = useMemo(
    () => ({
      organizers,
      isLoading,
      getOrganizerBySlug,
    }),
    [organizers, isLoading, getOrganizerBySlug],
  );

  return <OrganizersContext.Provider value={value}>{children}</OrganizersContext.Provider>;
}

export function useOrganizers() {
  const context = useContext(OrganizersContext);

  if (!context) {
    throw new Error('useOrganizers måste användas inom OrganizersProvider');
  }

  return context;
}
