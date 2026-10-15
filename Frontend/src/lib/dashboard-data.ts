import { useState, useEffect } from "react";
import { getEventsApi } from "./api";

export interface RecentTriage {
  id: string;
  participant: string;
  time: string;
  responsible: string;
  status: "Normal" | "Atenção" | "Alterado";
  result: string;
}

export interface DashboardEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  metrics: {
    attended: number;
    triagesDone: number;
    alteredTriages: number;
    referrals: number;
    courtesyGranted: number;
    scheduledToday: number;
  };
  charts: {
    ageGroups: { age: string; count: number }[];
    examResults: { name: string; percentage: number; color: string }[];
    servicesDist: { name: string; count: number }[];
    examAlterations: { exam: string; count: number }[];
    eventEvolution: { event: string; atendimentos: number }[];
    referrals: { destination: string; count: number; color: string }[];
  };
  recentTriages: RecentTriage[];
}

export const EMPTY_EVENT: DashboardEvent = {
  id: "evt-01",
  name: "Carregando evento...",
  date: new Date().toLocaleDateString("pt-BR"),
  location: "Carregando...",
  metrics: {
    attended: 0,
    triagesDone: 0,
    alteredTriages: 0,
    referrals: 0,
    courtesyGranted: 0,
    scheduledToday: 0,
  },
  charts: {
    ageGroups: [
      { age: "18–30", count: 0 },
      { age: "31–45", count: 0 },
      { age: "46–60", count: 0 },
      { age: "60+", count: 0 },
    ],
    examResults: [
      { name: "Dentro dos parâmetros", percentage: 100, color: "var(--color-primary)" },
      { name: "Com alterações", percentage: 0, color: "var(--color-warning)" },
    ],
    servicesDist: [
      { name: "Triagem Sinais", count: 0 },
      { name: "Avaliação Funcional", count: 0 },
      { name: "Orientações Posturais", count: 0 },
    ],
    examAlterations: [
      { exam: "Pressão Arterial", count: 0 },
      { exam: "Glicemia", count: 0 },
      { exam: "IMC Elevado", count: 0 },
      { exam: "SpO₂ Baixa", count: 0 },
    ],
    eventEvolution: [
      { event: "Atual", atendimentos: 0 },
    ],
    referrals: [
      { destination: "Studio Adriane Câmara", count: 0, color: "#1b806a" },
    ],
  },
  recentTriages: [],
};

const STORAGE_KEY = "pro_mover_events_cache";

export function getCachedEvents(): DashboardEvent[] {
  if (typeof window === "undefined") return [EMPTY_EVENT];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [EMPTY_EVENT];
    return JSON.parse(raw);
  } catch {
    return [EMPTY_EVENT];
  }
}

export function saveCachedEvents(events: DashboardEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event("pro_mover_events_change"));
}

export function useDashboardEvents() {
  const [events, setEvents] = useState<DashboardEvent[]>(getCachedEvents);
  const [loading, setLoading] = useState(true);

  const refreshEvents = async () => {
    try {
      const data = await getEventsApi();
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
        saveCachedEvents(data);
      }
    } catch (err: any) {
      console.warn("Falha ao buscar eventos do backend:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();

    const handler = () => {
      setEvents(getCachedEvents());
    };
    window.addEventListener("pro_mover_events_change", handler);
    return () => {
      window.removeEventListener("pro_mover_events_change", handler);
    };
  }, []);

  return {
    events,
    loading,
    refreshEvents,
  };
}
