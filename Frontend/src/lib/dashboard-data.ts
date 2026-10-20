import { useState, useEffect } from "react";
import { getEventsApi, createEventApi } from "./api";

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
  startDate?: string;
  endDate?: string;
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

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export function formatCampaignPeriod(startDate?: string, endDate?: string, fallbackDate?: string): string {
  if (startDate && endDate) {
    const startFormatted = formatDisplayDate(startDate);
    const endFormatted = formatDisplayDate(endDate);
    if (startDate === endDate) {
      return startFormatted;
    }
    return `${startFormatted} a ${endFormatted}`;
  }
  if (startDate) return formatDisplayDate(startDate);
  if (fallbackDate) return formatDisplayDate(fallbackDate);
  return "";
}

export const EMPTY_EVENT: DashboardEvent = {
  id: "",
  name: "Nenhuma campanha ativa",
  date: new Date().toLocaleDateString("pt-BR"),
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  location: "",
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
      { exam: "IMC / Obesidade", count: 0 },
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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Filtra campanhas residuais de mocks antigos
    return list.filter((e) => e && e.id && !["evt-01", "evt-02", "evt-03"].includes(e.id));
  } catch {
    return [];
  }
}

export function saveCachedEvents(events: DashboardEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event("pro_mover_events_change"));
}

export function clearStoredCampaigns() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("pro_mover_events_change"));
}

export function useDashboardEvents() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEvents = async () => {
    try {
      const data = await getEventsApi();
      if (Array.isArray(data)) {
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
    const cached = getCachedEvents();
    if (cached.length > 0) {
      setEvents(cached);
    }
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

export async function createDashboardCampaign(data: {
  name: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  location: string;
}): Promise<DashboardEvent> {
  let createdId = `evt-${Date.now().toString().slice(-6)}`;
  const startDate = (data.startDate || data.date || new Date().toISOString().split("T")[0]).trim();
  const endDate = (data.endDate || startDate).trim();
  const dateFormatted = data.date?.trim() || formatCampaignPeriod(startDate, endDate);

  try {
    const apiResult = await createEventApi({
      name: data.name.trim(),
      date: dateFormatted,
      startDate,
      endDate,
      location: data.location.trim(),
    });
    if (apiResult && apiResult.id) {
      createdId = apiResult.id;
    }
  } catch (err: any) {
    console.warn("Backend offline ou erro ao salvar campanha:", err.message);
  }

  const newEvent: DashboardEvent = {
    id: createdId,
    name: data.name.trim(),
    date: dateFormatted,
    startDate,
    endDate,
    location: data.location.trim(),
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
        { exam: "IMC / Obesidade", count: 0 },
        { exam: "SpO₂ Baixa", count: 0 },
      ],
      eventEvolution: [
        { event: data.name.split(":")[0] || "Nova Ação", atendimentos: 0 },
      ],
      referrals: [
        { destination: "Studio Adriane Câmara", count: 0, color: "#1b806a" },
      ],
    },
    recentTriages: [],
  };

  const current = getCachedEvents();
  const updated = [newEvent, ...current.filter((e) => e.id !== createdId)];
  saveCachedEvents(updated);

  return newEvent;
}

