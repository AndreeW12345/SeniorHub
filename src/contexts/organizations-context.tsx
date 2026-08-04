import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Organization } from '@/constants/organizations';
import {
  findOrganizationById,
  findOrganizationBySlug,
} from '@/constants/organizations';
import { isFirebaseConfigured } from '@/firebase/config';
import { fetchOrganizationsFromFirestore } from '@/services/organizations';

type OrganizationsContextValue = {
  organizations: Organization[];
  isLoading: boolean;
  getOrganizationById: (organizationId: string | null | undefined) => Organization | undefined;
  getOrganizationBySlug: (slug: string | null | undefined) => Organization | undefined;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null);

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrganizations = useCallback(async () => {
    try {
      if (!isFirebaseConfigured()) {
        setOrganizations([]);
        return;
      }

      const remote = await fetchOrganizationsFromFirestore();
      setOrganizations(remote);
    } catch (error) {
      console.warn('Kunde inte uppdatera organisationer från Firestore:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganizations() {
      setIsLoading(true);

      try {
        if (!isFirebaseConfigured()) {
          if (isMounted) {
            setOrganizations([]);
          }
          return;
        }

        const remote = await fetchOrganizationsFromFirestore();
        if (isMounted) {
          setOrganizations(remote);
        }
      } catch (error) {
        console.warn('Kunde inte ladda organisationer från Firestore:', error);
        if (isMounted) {
          setOrganizations([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, []);

  const getOrganizationById = useCallback(
    (organizationId: string | null | undefined) =>
      findOrganizationById(organizations, organizationId),
    [organizations],
  );

  const getOrganizationBySlug = useCallback(
    (slug: string | null | undefined) => findOrganizationBySlug(organizations, slug),
    [organizations],
  );

  const value = useMemo(
    () => ({
      organizations,
      isLoading,
      getOrganizationById,
      getOrganizationBySlug,
      refreshOrganizations,
    }),
    [
      organizations,
      isLoading,
      getOrganizationById,
      getOrganizationBySlug,
      refreshOrganizations,
    ],
  );

  return (
    <OrganizationsContext.Provider value={value}>{children}</OrganizationsContext.Provider>
  );
}

export function useOrganizations() {
  const context = useContext(OrganizationsContext);

  if (!context) {
    throw new Error('useOrganizations måste användas inom OrganizationsProvider');
  }

  return context;
}
