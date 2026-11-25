// AppContext.tsx – global state store
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { AirSnapshot, WeatherSnapshot, AqiCategory, Theme } from './core/types';
import { aqiToCategory, categoryToTheme } from './core/types';
import { fetchAirSnapshot, fetchWeatherSnapshot } from './core/air';
import { getLatestAirSnapshot, getLatestWeatherSnapshot, getHousehold, getLocation, getLifestyle } from './core/db';
import type { HouseholdDoc, LocationDoc } from './core/db';
import type { Lifestyle } from './core/types';
import type { Lang } from './core/i18n';

interface AppState {
  air: AirSnapshot | null;
  weather: WeatherSnapshot | null;
  location: LocationDoc | null;
  household: HouseholdDoc | null;
  lifestyle: Lifestyle;
  lang: Lang;
  theme: Theme;
  category: AqiCategory;
  activeMemberId: string | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setLang: (l: Lang) => void;
  setActiveMember: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [air, setAir] = useState<AirSnapshot | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [location, setLocation] = useState<LocationDoc | null>(null);
  const [household, setHousehold] = useState<HouseholdDoc | null>(null);
  const [lifestyle, setLifestyle] = useState<Lifestyle>({});
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const refreshing = useRef(false);

  const category: AqiCategory = air ? aqiToCategory(air.usAqi) : 'Hazy';
  const theme: Theme = categoryToTheme(category);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const refreshData = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const [h, loc, ls] = await Promise.all([getHousehold(), getLocation(), getLifestyle()]);
      setHousehold(h ?? null);
      setLocation(loc ?? null);
      setLifestyle(ls);
      if (h?.language) setLang(h.language as Lang);
      if (h?.members?.[0]) setActiveMemberId((prev) => prev ?? h.primaryMemberId ?? h.members[0].id);

      if (loc) {
        const [freshAir, freshWeather] = await Promise.all([
          fetchAirSnapshot(loc.lat, loc.lng, loc.label),
          fetchWeatherSnapshot(loc.lat, loc.lng, loc.label),
        ]);
        setAir(freshAir);
        setWeather(freshWeather);
        setLocation(loc);
      }
    } catch (e) {
      // fall back to cached
      const cachedAir = await getLatestAirSnapshot();
      const cachedWeather = await getLatestWeatherSnapshot();
      if (cachedAir) setAir(cachedAir);
      if (cachedWeather) setWeather(cachedWeather);
      setError('Using cached data – you appear to be offline.');
    } finally {
      refreshing.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [h, loc, ls] = await Promise.all([getHousehold(), getLocation(), getLifestyle()]);
        setHousehold(h ?? null);
        setLocation(loc ?? null);
        setLifestyle(ls);
        if (h?.language) setLang(h.language as Lang);
        if (h?.members?.[0]) setActiveMemberId(h.primaryMemberId ?? h.members[0].id);

        // Load cached first
        const [cachedAir, cachedWeather] = await Promise.all([getLatestAirSnapshot(), getLatestWeatherSnapshot()]);
        if (cachedAir) setAir(cachedAir);
        if (cachedWeather) setWeather(cachedWeather);

        // Then refresh
        if (loc) await refreshData();
      } catch (e) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshData]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const timer = setInterval(refreshData, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshData]);

  return (
    <Ctx.Provider value={{
      air, weather, location, household, lifestyle, lang, theme, category,
      activeMemberId, loading, error, refreshData,
      setLang: (l) => { setLang(l); },
      setActiveMember: setActiveMemberId,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
