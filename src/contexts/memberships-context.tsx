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

const MEMBERSHIPS_STORAGE_KEY = '@seniorhub/memberships';

type MembershipsContextValue = {
  membershipOrganizations: string[];
  isLoading: boolean;
  isMember: (organization: string) => boolean;
  markAsMember: (organization: string) => void;
  removeMembership: (organization: string) => void;
};

const MembershipsContext = createContext<MembershipsContextValue | null>(null);

function normalizeOrganization(organization: string): string {
  return organization.trim().toLocaleLowerCase('sv-SE');
}

function parseStoredMemberships(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function MembershipsProvider({ children }: { children: ReactNode }) {
  const [membershipOrganizations, setMembershipOrganizations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMemberships() {
      try {
        const stored = await AsyncStorage.getItem(MEMBERSHIPS_STORAGE_KEY);

        if (isMounted) {
          setMembershipOrganizations(parseStoredMemberships(stored));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMemberships();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistMemberships = useCallback(async (organizations: string[]) => {
    await AsyncStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(organizations));
  }, []);

  const isMember = useCallback(
    (organization: string) => {
      const normalized = normalizeOrganization(organization);
      return membershipOrganizations.some(
        (stored) => normalizeOrganization(stored) === normalized,
      );
    },
    [membershipOrganizations],
  );

  const markAsMember = useCallback(
    (organization: string) => {
      const trimmed = organization.trim();
      if (!trimmed) {
        return;
      }

      const normalized = normalizeOrganization(trimmed);

      setMembershipOrganizations((current) => {
        if (current.some((stored) => normalizeOrganization(stored) === normalized)) {
          return current;
        }

        const next = [...current, trimmed];
        void persistMemberships(next);
        return next;
      });
    },
    [persistMemberships],
  );

  const removeMembership = useCallback(
    (organization: string) => {
      const normalized = normalizeOrganization(organization);

      setMembershipOrganizations((current) => {
        const next = current.filter((stored) => normalizeOrganization(stored) !== normalized);
        void persistMemberships(next);
        return next;
      });
    },
    [persistMemberships],
  );

  const value = useMemo(
    () => ({
      membershipOrganizations,
      isLoading,
      isMember,
      markAsMember,
      removeMembership,
    }),
    [membershipOrganizations, isLoading, isMember, markAsMember, removeMembership],
  );

  return <MembershipsContext.Provider value={value}>{children}</MembershipsContext.Provider>;
}

export function useMemberships() {
  const context = useContext(MembershipsContext);

  if (!context) {
    throw new Error('useMemberships måste användas inom MembershipsProvider');
  }

  return context;
}
