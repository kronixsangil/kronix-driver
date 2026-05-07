//app\(driver)\components\DriverCityContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDriverAppMe, type DriverAppMeResponse } from "../../../lib/driverAuth";

type DriverCityContextValue = {
  loading: boolean;
  ready: boolean;

  driverId: string | null;

  cityId: string | null;
  citySlug: string | null;
  cityName: string | null;
  cityDepartment: string | null;
  cityLabel: string | null;

  refresh: () => Promise<void>;
};

const DriverCityContext = createContext<DriverCityContextValue | null>(null);

export function DriverCityProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DriverAppMeResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getDriverAppMe();
      setData(me);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const onAuthChanged = () => {
      load();
    };

    window.addEventListener("ct-auth-changed", onAuthChanged as any);
    window.addEventListener("auth:changed", onAuthChanged as any);

    return () => {
      window.removeEventListener("ct-auth-changed", onAuthChanged as any);
      window.removeEventListener("auth:changed", onAuthChanged as any);
    };
  }, [load]);

  const value = useMemo<DriverCityContextValue>(() => {
    const driverId = String(data?.user?.id ?? "").trim() || null;

    const cityId = String(data?.city?.id ?? "").trim() || null;
    const citySlug = String(data?.city?.slug ?? "").trim() || null;
    const cityName = String(data?.city?.name ?? "").trim() || null;
    const cityDepartment = String(data?.city?.department ?? "").trim() || null;

    const cityLabel =
      cityName && cityDepartment
        ? `${cityName}, ${cityDepartment}`
        : cityName || null;

    return {
      loading,
      ready: !loading,
      driverId,
      cityId,
      citySlug,
      cityName,
      cityDepartment,
      cityLabel,
      refresh: load,
    };
  }, [data, loading, load]);

  return (
    <DriverCityContext.Provider value={value}>
      {children}
    </DriverCityContext.Provider>
  );
}

export function useDriverCity() {
  const ctx = useContext(DriverCityContext);
  if (!ctx) {
    throw new Error("useDriverCity debe usarse dentro de DriverCityProvider");
  }
  return ctx;
}