import { useState, useEffect } from "react";

export interface AppSettings {
  // Bloco Evento comunitário
  eventDate: string;
  eventLocation: string;

  // Bloco Parâmetros demonstrativos de alerta
  systolicMax: number;
  diastolicMax: number;
  glucoseMax: number;
  oxygenMin: number;
  heartRateMin: number;
  heartRateMax: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  eventDate: new Date().toISOString().split("T")[0],
  eventLocation: "Farmácia Popular Santa Luzia",
  systolicMax: 140,
  diastolicMax: 90,
  glucoseMax: 180,
  oxygenMin: 95,
  heartRateMin: 50,
  heartRateMax: 100,
};

const STORAGE_KEY = "pro_mover_settings";

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      eventDate: parsed.eventDate || DEFAULT_SETTINGS.eventDate,
      eventLocation: parsed.eventLocation || DEFAULT_SETTINGS.eventLocation,
      systolicMax: Number(parsed.systolicMax) || DEFAULT_SETTINGS.systolicMax,
      diastolicMax: Number(parsed.diastolicMax) || DEFAULT_SETTINGS.diastolicMax,
      glucoseMax: Number(parsed.glucoseMax) || DEFAULT_SETTINGS.glucoseMax,
      oxygenMin: Number(parsed.oxygenMin) || DEFAULT_SETTINGS.oxygenMin,
      heartRateMin: Number(parsed.heartRateMin) || DEFAULT_SETTINGS.heartRateMin,
      heartRateMax: Number(parsed.heartRateMax) || DEFAULT_SETTINGS.heartRateMax,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = getStoredSettings();
  const updated: AppSettings = {
    eventDate: settings.eventDate !== undefined ? String(settings.eventDate) : current.eventDate,
    eventLocation: settings.eventLocation !== undefined ? String(settings.eventLocation).trim() : current.eventLocation,
    systolicMax: settings.systolicMax !== undefined ? Number(settings.systolicMax) : current.systolicMax,
    diastolicMax: settings.diastolicMax !== undefined ? Number(settings.diastolicMax) : current.diastolicMax,
    glucoseMax: settings.glucoseMax !== undefined ? Number(settings.glucoseMax) : current.glucoseMax,
    oxygenMin: settings.oxygenMin !== undefined ? Number(settings.oxygenMin) : current.oxygenMin,
    heartRateMin: settings.heartRateMin !== undefined ? Number(settings.heartRateMin) : current.heartRateMin,
    heartRateMax: settings.heartRateMax !== undefined ? Number(settings.heartRateMax) : current.heartRateMax,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("pro_mover_settings_change"));
  return updated;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(getStoredSettings);

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettingsState(getStoredSettings());
    };
    window.addEventListener("pro_mover_settings_change", handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);
    return () => {
      window.removeEventListener("pro_mover_settings_change", handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const saved = saveStoredSettings(newSettings);
    setSettingsState(saved);
    return saved;
  };

  return {
    settings,
    updateSettings,
  };
}
