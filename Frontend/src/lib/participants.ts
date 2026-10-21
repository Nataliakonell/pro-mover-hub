import { useState, useEffect } from "react";
import {
  getParticipantsApi,
  createParticipantApi,
  addAttendanceApi,
} from "./api";
import { DEFAULT_SETTINGS, type AppSettings } from "./settings";

export interface AttendanceRecord {
  id: string;
  date: string;
  eventName: string;
  type: string;
  responsible: string;
  summary: string;
  status: "Normal" | "Atenção" | "Alterado" | "Concluído";
  medicalRecordId?: string | undefined;
}

export interface Participant {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  ageGroup: string; // "18–30" | "31–45" | "46–60" | "60+" | "< 18"
  cpf: string;
  phone: string;
  eventId?: string | null;
  createdAt: string;
  attendances: AttendanceRecord[];
}

const STORAGE_KEY = "pro_mover_participants_list";

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function calculateAge(birthDateString: string): { age: number; group: string } | null {
  if (!birthDateString) return null;
  const parts = birthDateString.split("-");
  if (parts.length !== 3) return null;
  const birthYear = Number(parts[0]);
  const birthMonth = Number(parts[1]) - 1;
  const birthDay = Number(parts[2]);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }

  if (age < 0 || isNaN(age)) return null;

  let group = "18–30";
  if (age < 18) group = "18–30";
  else if (age <= 30) group = "18–30";
  else if (age <= 45) group = "31–45";
  else if (age <= 60) group = "46–60";
  else group = "60+";

  return { age, group };
}

export interface AlterationsDetails {
  isNormal: boolean;
  hasAlterations: boolean;
  alterationsList: string[];
  cleanSummary: string;
}

export function extractAlterationsDetails(
  summary?: string | null,
  status?: string | null,
  settings?: AppSettings
): AlterationsDetails {
  const normSummary = summary || "";
  const lower = normSummary.toLowerCase();
  const cfg = settings || DEFAULT_SETTINGS;

  // 1. Caso o laudo já tenha o padrão explícito "Alterações detectadas: ..."
  if (normSummary.includes("Alterações detectadas:")) {
    const match = normSummary.match(/Alterações detectadas:\s*([^\[\]]+)/i);
    if (match && match[1]) {
      const items = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        isNormal: false,
        hasAlterations: true,
        alterationsList: items,
        cleanSummary: normSummary,
      };
    }
  }

  // 2. Caso afirme expressamente normalidade
  if (
    normSummary.includes("Parâmetros Clínicos Normais") ||
    lower.includes("parâmetros normais") ||
    lower.includes("dentro dos limites")
  ) {
    return {
      isNormal: true,
      hasAlterations: false,
      alterationsList: [],
      cleanSummary: normSummary,
    };
  }

  // 3. Fallback inteligente: analisa os valores contidos no texto ou status
  const detected: string[] = [];

  // Pressão Arterial (ex: PA 130/85 ou 150/90)
  const paMatch = normSummary.match(/PA\s*(\d{2,3})\s*[\/x]\s*(\d{2,3})/i);
  if (paMatch && paMatch[1] && paMatch[2]) {
    const sys = parseInt(paMatch[1]);
    const dia = parseInt(paMatch[2]);
    if (sys < cfg.systolicMin || sys > cfg.systolicMax || dia < cfg.diastolicMin || dia > cfg.diastolicMax) {
      detected.push(`Pressão Arterial Alterada (${sys}/${dia} mmHg)`);
    } else if (sys >= 130 || dia >= 85) {
      detected.push(`Pressão Arterial Limítrofe (${sys}/${dia} mmHg)`);
    }
  }

  // SpO2
  const spo2Match = normSummary.match(/SpO[₂2]\s*(\d{2,3})/i);
  if (spo2Match && spo2Match[1]) {
    const ox = parseFloat(spo2Match[1]);
    const minOx = cfg.oxygenMin ?? 95;
    const maxOx = cfg.oxygenMax ?? 100;
    if (ox < minOx || ox > maxOx) {
      detected.push(`SpO₂ Alterada (${ox}%)`);
    }
  }

  // FC
  const fcMatch = normSummary.match(/FC\s*(\d{2,3})/i);
  if (fcMatch && fcMatch[1]) {
    const hr = parseFloat(fcMatch[1]);
    if (hr < cfg.heartRateMin || hr > cfg.heartRateMax) {
      detected.push(`Frequência Cardíaca Alterada (${hr} bpm)`);
    }
  }

  // IMC
  if (lower.includes("sobrepeso")) {
    detected.push("IMC em Atenção (Sobrepeso)");
  } else if (lower.includes("obesidade")) {
    detected.push("IMC Alterado (Obesidade)");
  } else if (lower.includes("abaixo do peso")) {
    detected.push("IMC em Atenção (Abaixo do peso)");
  }

  if (detected.length > 0) {
    return {
      isNormal: false,
      hasAlterations: true,
      alterationsList: detected,
      cleanSummary: normSummary,
    };
  }

  // Se o status veio explicitamente como Alterado ou Atenção mas nenhum valor numérico foi pego
  if (status === "Alterado") {
    return {
      isNormal: false,
      hasAlterations: true,
      alterationsList: ["Exame com alteração clínica registrada."],
      cleanSummary: normSummary,
    };
  }

  if (status === "Atenção") {
    return {
      isNormal: false,
      hasAlterations: true,
      alterationsList: ["Exame requer atenção / acompanhamento preventivo."],
      cleanSummary: normSummary,
    };
  }

  return {
    isNormal: true,
    hasAlterations: false,
    alterationsList: [],
    cleanSummary: normSummary,
  };
}

export function getStoredParticipants(): Participant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((p) => !["PART-001", "PART-002", "PART-003", "PART-004", "PART-005"].includes(p.id));
  } catch {
    return [];
  }
}

export function saveStoredParticipants(data: Participant[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("pro_mover_participants_change"));
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Sincroniza diretamente com o banco de dados PostgreSQL
  const refreshParticipants = async () => {
    try {
      const data = await getParticipantsApi();
      if (Array.isArray(data)) {
        saveStoredParticipants(data);
        setParticipants(data);
      }
    } catch (err: any) {
      console.warn("Backend offline ou iniciando, usando dados locais:", err.message);
    }
  };

  useEffect(() => {
    const cached = getStoredParticipants();
    if (cached.length > 0) {
      setParticipants(cached);
    }
    refreshParticipants();

    const handler = () => {
      setParticipants(getStoredParticipants());
    };
    window.addEventListener("pro_mover_participants_change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("pro_mover_participants_change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addParticipant = async (newP: {
    name: string;
    birthDate: string;
    cpf: string;
    phone: string;
    eventId?: string | undefined;
    eventName?: string | undefined;
  }): Promise<Participant> => {
    const ageInfo = calculateAge(newP.birthDate) || { age: 0, group: "18–30" };

    // Salva obrigatoriamente no PostgreSQL através da API
    const created = await createParticipantApi({
      name: newP.name.trim(),
      birthDate: newP.birthDate,
      age: ageInfo.age,
      ageGroup: ageInfo.group,
      cpf: newP.cpf,
      phone: newP.phone,
      eventId: newP.eventId || undefined,
    });

    await refreshParticipants();
    return created;
  };

  const addAttendance = async (
    participantId: string,
    attData: {
      eventName: string;
      type: string;
      responsible: string;
      status: "Normal" | "Atenção" | "Alterado" | "Concluído";
      summary: string;
      medicalRecordId?: string | undefined;
    }
  ) => {
    // Salva obrigatoriamente no PostgreSQL
    await addAttendanceApi(participantId, {
      date: new Date().toLocaleDateString("pt-BR"),
      ...attData,
    });
    await refreshParticipants();
  };

  // Calcula a distribuição etária dinamicamente baseada nos dados reais dos participantes
  const getAgeDistribution = (eventId?: string) => {
    const eventParticipants = eventId
      ? participants.filter((p) => p.eventId === eventId)
      : participants;

    const counts: Record<string, number> = {
      "18–30": 0,
      "31–45": 0,
      "46–60": 0,
      "60+": 0,
    };

    eventParticipants.forEach((p) => {
      const group = p.ageGroup in counts ? p.ageGroup : "18–30";
      counts[group] = (counts[group] ?? 0) + 1;
    });

    return [
      { age: "18–30", count: counts["18–30"] ?? 0 },
      { age: "31–45", count: counts["31–45"] ?? 0 },
      { age: "46–60", count: counts["46–60"] ?? 0 },
      { age: "60+", count: counts["60+"] ?? 0 },
    ];
  };

  const getExtraCount = (eventId: string) => {
    return participants.filter((p) => p.eventId === eventId).length;
  };

  return {
    participants,
    addParticipant,
    addAttendance,
    getAgeDistribution,
    getExtraCount,
    refreshParticipants,
  };
}
