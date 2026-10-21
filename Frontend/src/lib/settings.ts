import { useState, useEffect } from "react";
import { getSettingsApi, updateSettingsApi } from "./api";

export interface AppSettings {
  // Bloco Evento comunitário (legado mantido para compatibilidade)
  eventDate: string;
  eventLocation: string;

  // Bloco Parâmetros demonstrativos de alerta (faixas mínimas e máximas)
  systolicMin: number;
  systolicMax: number;
  diastolicMin: number;
  diastolicMax: number;
  oxygenMin: number;
  oxygenMax: number;
  heartRateMin: number;
  heartRateMax: number;

  // Bloco Parâmetros de Classificação do IMC
  imcUnderweightMax: number; // Abaixo do peso: < 18.5
  imcNormalMax: number;      // Peso normal: 18.5 – 24.9
  imcOverweightMax: number;  // Sobrepeso: 25.0 – 29.9
  imcObesity1Max: number;    // Obesidade Grau 1: 30.0 – 34.9
  imcObesity2Max: number;    // Obesidade Grau 2: 35.0 – 39.9
}

export const DEFAULT_SETTINGS: AppSettings = {
  eventDate: new Date().toISOString().split("T")[0] || "",
  eventLocation: "Ação Comunitária Conecta Saúde",
  systolicMin: 90,
  systolicMax: 140,
  diastolicMin: 60,
  diastolicMax: 90,
  oxygenMin: 95,
  oxygenMax: 100,
  heartRateMin: 50,
  heartRateMax: 100,

  // Valores padrão para IMC (OMS)
  imcUnderweightMax: 18.5,
  imcNormalMax: 24.9,
  imcOverweightMax: 29.9,
  imcObesity1Max: 34.9,
  imcObesity2Max: 39.9,
};

export interface IMCClassification {
  category: "Abaixo do peso" | "Peso normal" | "Sobrepeso" | "Obesidade Grau 1" | "Obesidade Grau 2" | "Obesidade Grau 3";
  status: "Normal" | "Atenção" | "Alterado";
  badgeClass: string;
}

export function classifyIMC(imc: number, settings?: AppSettings): IMCClassification {
  const s = settings || DEFAULT_SETTINGS;
  const under = s.imcUnderweightMax ?? 18.5;
  const normal = s.imcNormalMax ?? 24.9;
  const over = s.imcOverweightMax ?? 29.9;
  const ob1 = s.imcObesity1Max ?? 34.9;
  const ob2 = s.imcObesity2Max ?? 39.9;

  if (imc < under) {
    return {
      category: "Abaixo do peso",
      status: "Atenção",
      badgeClass: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
    };
  }
  if (imc <= normal) {
    return {
      category: "Peso normal",
      status: "Normal",
      badgeClass: "bg-primary/10 text-primary border border-primary/20",
    };
  }
  if (imc <= over) {
    return {
      category: "Sobrepeso",
      status: "Atenção",
      badgeClass: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
    };
  }
  if (imc <= ob1) {
    return {
      category: "Obesidade Grau 1",
      status: "Alterado",
      badgeClass: "bg-destructive/15 text-destructive border border-destructive/20",
    };
  }
  if (imc <= ob2) {
    return {
      category: "Obesidade Grau 2",
      status: "Alterado",
      badgeClass: "bg-destructive/20 text-destructive border border-destructive/30 font-semibold",
    };
  }
  return {
    category: "Obesidade Grau 3",
    status: "Alterado",
    badgeClass: "bg-destructive text-destructive-foreground font-bold shadow-2xs",
  };
}

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
      systolicMin: parsed.systolicMin !== undefined ? Number(parsed.systolicMin) : DEFAULT_SETTINGS.systolicMin,
      systolicMax: parsed.systolicMax !== undefined ? Number(parsed.systolicMax) : (parsed.sysThreshold ? Number(parsed.sysThreshold) : DEFAULT_SETTINGS.systolicMax),
      diastolicMin: parsed.diastolicMin !== undefined ? Number(parsed.diastolicMin) : DEFAULT_SETTINGS.diastolicMin,
      diastolicMax: parsed.diastolicMax !== undefined ? Number(parsed.diastolicMax) : (parsed.diaThreshold ? Number(parsed.diaThreshold) : DEFAULT_SETTINGS.diastolicMax),
      oxygenMin: Number(parsed.oxygenMin) || DEFAULT_SETTINGS.oxygenMin,
      oxygenMax: parsed.oxygenMax !== undefined ? Number(parsed.oxygenMax) : DEFAULT_SETTINGS.oxygenMax,
      heartRateMin: Number(parsed.heartRateMin) || DEFAULT_SETTINGS.heartRateMin,
      heartRateMax: Number(parsed.heartRateMax) || DEFAULT_SETTINGS.heartRateMax,

      imcUnderweightMax: parsed.imcUnderweightMax !== undefined ? Number(parsed.imcUnderweightMax) : DEFAULT_SETTINGS.imcUnderweightMax,
      imcNormalMax: parsed.imcNormalMax !== undefined ? Number(parsed.imcNormalMax) : DEFAULT_SETTINGS.imcNormalMax,
      imcOverweightMax: parsed.imcOverweightMax !== undefined ? Number(parsed.imcOverweightMax) : DEFAULT_SETTINGS.imcOverweightMax,
      imcObesity1Max: parsed.imcObesity1Max !== undefined ? Number(parsed.imcObesity1Max) : DEFAULT_SETTINGS.imcObesity1Max,
      imcObesity2Max: parsed.imcObesity2Max !== undefined ? Number(parsed.imcObesity2Max) : DEFAULT_SETTINGS.imcObesity2Max,
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
    systolicMin: settings.systolicMin !== undefined ? Number(settings.systolicMin) : current.systolicMin,
    systolicMax: settings.systolicMax !== undefined ? Number(settings.systolicMax) : current.systolicMax,
    diastolicMin: settings.diastolicMin !== undefined ? Number(settings.diastolicMin) : current.diastolicMin,
    diastolicMax: settings.diastolicMax !== undefined ? Number(settings.diastolicMax) : current.diastolicMax,
    oxygenMin: settings.oxygenMin !== undefined ? Number(settings.oxygenMin) : current.oxygenMin,
    oxygenMax: settings.oxygenMax !== undefined ? Number(settings.oxygenMax) : current.oxygenMax,
    heartRateMin: settings.heartRateMin !== undefined ? Number(settings.heartRateMin) : current.heartRateMin,
    heartRateMax: settings.heartRateMax !== undefined ? Number(settings.heartRateMax) : current.heartRateMax,

    imcUnderweightMax: settings.imcUnderweightMax !== undefined ? Number(settings.imcUnderweightMax) : current.imcUnderweightMax,
    imcNormalMax: settings.imcNormalMax !== undefined ? Number(settings.imcNormalMax) : current.imcNormalMax,
    imcOverweightMax: settings.imcOverweightMax !== undefined ? Number(settings.imcOverweightMax) : current.imcOverweightMax,
    imcObesity1Max: settings.imcObesity1Max !== undefined ? Number(settings.imcObesity1Max) : current.imcObesity1Max,
    imcObesity2Max: settings.imcObesity2Max !== undefined ? Number(settings.imcObesity2Max) : current.imcObesity2Max,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("pro_mover_settings_change"));
  return updated;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(getStoredSettings);

  // Sincroniza com PostgreSQL ao montar
  useEffect(() => {
    getSettingsApi()
      .then((data) => {
        if (data) {
          const mapped: AppSettings = {
            eventDate: data.eventDate || DEFAULT_SETTINGS.eventDate,
            eventLocation: data.eventLocation || DEFAULT_SETTINGS.eventLocation,
            systolicMin: data.sysMinThreshold ?? DEFAULT_SETTINGS.systolicMin,
            systolicMax: data.sysMaxThreshold ?? data.sysThreshold ?? DEFAULT_SETTINGS.systolicMax,
            diastolicMin: data.diaMinThreshold ?? DEFAULT_SETTINGS.diastolicMin,
            diastolicMax: data.diaMaxThreshold ?? data.diaThreshold ?? DEFAULT_SETTINGS.diastolicMax,
            oxygenMin: data.spo2Threshold ?? DEFAULT_SETTINGS.oxygenMin,
            oxygenMax: data.spo2MaxThreshold ?? DEFAULT_SETTINGS.oxygenMax,
            heartRateMin: data.hrMinThreshold ?? DEFAULT_SETTINGS.heartRateMin,
            heartRateMax: data.hrMaxThreshold ?? DEFAULT_SETTINGS.heartRateMax,
            imcUnderweightMax: DEFAULT_SETTINGS.imcUnderweightMax,
            imcNormalMax: DEFAULT_SETTINGS.imcNormalMax,
            imcOverweightMax: DEFAULT_SETTINGS.imcOverweightMax,
            imcObesity1Max: DEFAULT_SETTINGS.imcObesity1Max,
            imcObesity2Max: DEFAULT_SETTINGS.imcObesity2Max,
          };
          saveStoredSettings(mapped);
          setSettingsState(mapped);
        }
      })
      .catch((err) => {
        console.warn("Backend offline ou iniciando, usando configurações locais:", err.message);
      });
  }, []);

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

    // Salva no PostgreSQL
    updateSettingsApi({
      eventDate: saved.eventDate,
      eventLocation: saved.eventLocation,
      sysMinThreshold: saved.systolicMin,
      sysMaxThreshold: saved.systolicMax,
      diaMinThreshold: saved.diastolicMin,
      diaMaxThreshold: saved.diastolicMax,
      sysThreshold: saved.systolicMax,
      diaThreshold: saved.diastolicMax,
      spo2Threshold: saved.oxygenMin,
      hrMinThreshold: saved.heartRateMin,
      hrMaxThreshold: saved.heartRateMax,
    }).catch((err) => {
      console.warn("Falha ao sincronizar configurações no PostgreSQL:", err.message);
    });

    return saved;
  };

  return {
    settings,
    updateSettings,
  };
}
