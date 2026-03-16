import { useMemo } from "react";

const SETTINGS_KEY = "horumar.app.settings";

export interface AppSettings {
  currency: string;
  locale: string;
  enableCompactTables: boolean;
}

const defaults: AppSettings = {
  currency: "KES",
  locale: "en-KE",
  enableCompactTables: false,
};

export function useAppSettings() {
  const settings = useMemo(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      return defaults;
    }
  }, []);

  const updateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    window.location.reload();
  };

  return {
    settings,
    updateSettings,
  };
}
