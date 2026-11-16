import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_UPDATES,
} from '../data/defaults';
import {
  fetchPublicCategories,
  fetchPublicProducts,
  fetchPublicUpdates,
  fetchSiteSettings,
} from '../services/firestoreService';
import type {
  Category,
  Product,
  SiteSettings,
  UpdatePost,
} from '../types/nexora';
import { useTheme } from './ThemeContext';

interface SiteDataContextValue {
  products: Product[];
  categories: Category[];
  updates: UpdatePost[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(
  undefined,
);

export function SiteDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { applyDefaultIfUnset } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [updates, setUpdates] = useState<UpdatePost[]>(DEFAULT_UPDATES);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPublicData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodList, catList, updList, loadedSettings] = await Promise.all([
        fetchPublicProducts(),
        fetchPublicCategories(),
        fetchPublicUpdates(),
        fetchSiteSettings(),
      ]);

      setProducts(prodList);
      setCategories(catList.length > 0 ? catList : DEFAULT_CATEGORIES);
      setUpdates(updList.length > 0 ? updList : DEFAULT_UPDATES);

      if (loadedSettings) {
        setSettings(loadedSettings);
        applyDefaultIfUnset(loadedSettings.defaultTheme);
      } else {
        setSettings(DEFAULT_SITE_SETTINGS);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load NEXORA catalog data.',
      );
      setCategories(DEFAULT_CATEGORIES);
      setUpdates(DEFAULT_UPDATES);
      setSettings(DEFAULT_SITE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [applyDefaultIfUnset]);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  return (
    <SiteDataContext.Provider
      value={{
        products,
        categories,
        updates,
        settings,
        loading,
        error,
        refreshPublicData,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return ctx;
}
