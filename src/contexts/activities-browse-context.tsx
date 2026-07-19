import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Category } from '@/constants/activities';
import type { ActivityQuickFilter } from '@/constants/activity-filters';
import { toggleActivityQuickFilter } from '@/utils/activity-browse';

type ActivitiesBrowseContextValue = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  /** Active multi-select quick filters. Empty = "Alla". */
  quickFilters: ActivityQuickFilter[];
  toggleQuickFilter: (filter: ActivityQuickFilter) => void;
  clearQuickFilters: () => void;
};

const ActivitiesBrowseContext = createContext<ActivitiesBrowseContextValue | null>(null);

/**
 * Persists browse search/filter state while navigating to activity details and back.
 */
export function ActivitiesBrowseProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Alla');
  const [quickFilters, setQuickFilters] = useState<ActivityQuickFilter[]>([]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const clearSearchQuery = useCallback(() => {
    setSearchQueryState('');
  }, []);

  const toggleQuickFilter = useCallback((filter: ActivityQuickFilter) => {
    setQuickFilters((current) => toggleActivityQuickFilter(current, filter));
  }, []);

  const clearQuickFilters = useCallback(() => {
    setQuickFilters([]);
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      clearSearchQuery,
      selectedCategory,
      setSelectedCategory,
      quickFilters,
      toggleQuickFilter,
      clearQuickFilters,
    }),
    [
      searchQuery,
      setSearchQuery,
      clearSearchQuery,
      selectedCategory,
      quickFilters,
      toggleQuickFilter,
      clearQuickFilters,
    ],
  );

  return (
    <ActivitiesBrowseContext.Provider value={value}>{children}</ActivitiesBrowseContext.Provider>
  );
}

export function useActivitiesBrowse() {
  const context = useContext(ActivitiesBrowseContext);

  if (!context) {
    throw new Error('useActivitiesBrowse måste användas inom ActivitiesBrowseProvider');
  }

  return context;
}
