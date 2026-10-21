import { useState, useEffect } from "react";
import { getTriagesApi, createTriageApi } from "./api";

export interface TriageRecord {
  id: string;
  participantId?: string | undefined;
  participantName: string;
  eventId: string;
  time: string;
  responsible: string;
  status: "Normal" | "Atenção" | "Alterado";
  systolic: number;
  diastolic: number;
  spo2: number;
  heartRate: number;
  result: string;
  createdAt?: string | undefined;
}

const STORAGE_KEY = "conecta_saude_triages_cache";

export function getCachedTriages(): TriageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCachedTriages(list: TriageRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("conecta_saude_triages_change"));
}

export function useTriages(eventId?: string | null) {
  const [triages, setTriages] = useState<TriageRecord[]>([]);

  const refreshTriages = async () => {
    try {
      const data = await getTriagesApi(eventId || undefined);
      if (Array.isArray(data)) {
        // Se filtramos por eventId, mescla com o cache
        const current = getCachedTriages();
        const otherEvents = eventId ? current.filter((t) => t.eventId !== eventId) : [];
        const merged = [...data, ...otherEvents];
        saveCachedTriages(merged);
        setTriages(merged);
      }
    } catch (err: any) {
      console.warn("Backend offline ou iniciando, usando dados locais de triagens:", err.message);
    }
  };

  useEffect(() => {
    const cached = getCachedTriages();
    if (cached.length > 0) {
      setTriages(cached);
    }
    refreshTriages();

    const handler = () => {
      setTriages(getCachedTriages());
    };
    window.addEventListener("conecta_saude_triages_change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("conecta_saude_triages_change", handler);
      window.removeEventListener("storage", handler);
    };
  }, [eventId]);

  const addTriage = async (newT: {
    participantId?: string | undefined;
    participantName: string;
    eventId: string;
    responsible: string;
    status: "Normal" | "Atenção" | "Alterado";
    systolic: number;
    diastolic: number;
    spo2: number;
    heartRate: number;
    result: string;
  }) => {
    const timeNow = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const localId = `TR-${Date.now().toString().slice(-4)}`;

    const record: TriageRecord = {
      id: localId,
      time: timeNow,
      ...newT,
      createdAt: new Date().toISOString(),
    };

    const current = getCachedTriages();
    const updated = [record, ...current];
    saveCachedTriages(updated);
    setTriages(updated);

    try {
      const apiRes = await createTriageApi({
        participantId: newT.participantId,
        participantName: newT.participantName,
        eventId: newT.eventId,
        time: timeNow,
        responsible: newT.responsible,
        status: newT.status,
        systolic: newT.systolic,
        diastolic: newT.diastolic,
        spo2: newT.spo2,
        heartRate: newT.heartRate,
        result: newT.result,
      });
      if (apiRes && apiRes.id) {
        const synced = updated.map((t) => (t.id === localId ? { ...t, id: apiRes.id } : t));
        saveCachedTriages(synced);
        setTriages(synced);
      }
    } catch (err: any) {
      console.warn("Falha ao salvar triagem no PostgreSQL (mantido em cache local):", err.message);
    }

    return record;
  };

  const campaignTriages = eventId ? triages.filter((t) => t.eventId === eventId) : triages;

  return {
    triages: campaignTriages,
    allTriages: triages,
    addTriage,
    refreshTriages,
  };
}
