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
import { REFRESH_ORGANIZATIONS_FETCH_OPTIONS } from '@/constants/organizations-refresh-fetch';
import { fetchOrganizationsFromFirestore } from '@/services/organizations';

const ORGANIZATIONS_LOAD_ERROR_MESSAGE =
  'Kunde inte hämta organisationer. Kontrollera nätverket och försök igen.';

function readOrganizationsLoadError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return ORGANIZATIONS_LOAD_ERROR_MESSAGE;
}

type OrganizationsContextValue = {
  organizations: Organization[];
  isLoading: boolean;
  loadError: string | null;
  getOrganizationById: (organizationId: string | null | undefined) => Organization | undefined;
  getOrganizationBySlug: (slug: string | null | undefined) => Organization | undefined;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null);

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshOrganizations = useCallback(async () => {
    try {
      if (!isFirebaseConfigured()) {
        setOrganizations([]);
        setLoadError(null);
        return;
      }

      const remote = await fetchOrganizationsFromFirestore(REFRESH_ORGANIZATIONS_FETCH_OPTIONS);
      setOrganizations(remote);
      setLoadError(null);
    } catch (error) {
      console.warn('Kunde inte uppdatera organisationer från Firestore:', error);
      setLoadError(readOrganizationsLoadError(error));
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
            setLoadError(null);
          }
          return;
        }

        const remote = await fetchOrganizationsFromFirestore();
        if (isMounted) {
          setOrganizations(remote);
          setLoadError(null);
        }
      } catch (error) {
        console.warn('Kunde inte ladda organisationer från Firestore:', error);
        if (isMounted) {
          setOrganizations([]);
          setLoadError(readOrganizationsLoadError(error));
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
      loadError,
      getOrganizationById,
      getOrganizationBySlug,
      refreshOrganizations,
    }),
    [
      organizations,
      isLoading,
      loadError,
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
