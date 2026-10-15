import { useState, useEffect } from "react";
import {
  getParticipantsApi,
  createParticipantApi,
  addAttendanceApi,
} from "./api";

export interface AttendanceRecord {
  id: string;
  date: string;
  eventName: string;
  type: string;
  responsible: string;
  summary: string;
  status: "Normal" | "Atenção" | "Alterado" | "Concluído";
  medicalRecordId?: string;
}

export interface Participant {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  ageGroup: string; // "18–30" | "31–45" | "46–60" | "60+" | "< 18"
  cpf: string;
  phone: string;
  eventId: string;
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
  const [participants, setParticipants] = useState<Participant[]>(getStoredParticipants);

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

  const addParticipant = (newP: {
    name: string;
    birthDate: string;
    cpf: string;
    phone: string;
    eventId: string;
    eventName?: string;
  }): Participant => {
    const ageInfo = calculateAge(newP.birthDate) || { age: 0, group: "18–30" };
    const newId = `PART-${Date.now().toString().slice(-4)}`;
    const eventLabel = newP.eventName || "Ação de Saúde Comunitária";

    const participant: Participant = {
      id: newId,
      name: newP.name.trim(),
      birthDate: newP.birthDate,
      age: ageInfo.age,
      ageGroup: ageInfo.group,
      cpf: newP.cpf,
      phone: newP.phone,
      eventId: newP.eventId,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      attendances: [
        {
          id: `ATT-${Date.now().toString().slice(-4)}`,
          date: new Date().toLocaleDateString("pt-BR"),
          eventName: eventLabel,
          type: "Cadastro e Acolhimento Comunitário",
          responsible: "Equipe PRO-MOVER",
          status: "Concluído",
          summary: "Cadastro inicial registrado. Elegível para triagem clínica e prontuário.",
          medicalRecordId: `PR-${newId}`,
        },
      ],
    };

    const current = getStoredParticipants();
    const updated = [participant, ...current];
    saveStoredParticipants(updated);
    setParticipants(updated);

    // Salva no PostgreSQL
    createParticipantApi({
      name: participant.name,
      birthDate: participant.birthDate,
      age: participant.age,
      ageGroup: participant.ageGroup,
      cpf: participant.cpf,
      phone: participant.phone,
      eventId: participant.eventId,
    })
      .then(() => refreshParticipants())
      .catch((err) => {
        console.warn("Falha ao salvar participante no PostgreSQL:", err.message);
      });

    return participant;
  };

  const addAttendance = (
    participantId: string,
    attData: {
      eventName: string;
      type: string;
      responsible: string;
      status: "Normal" | "Atenção" | "Alterado" | "Concluído";
      summary: string;
      medicalRecordId?: string;
    }
  ) => {
    const current = getStoredParticipants();
    const updated = current.map((p) => {
      if (p.id === participantId) {
        const newRecord: AttendanceRecord = {
          id: `ATT-${Date.now().toString().slice(-4)}`,
          date: new Date().toLocaleDateString("pt-BR"),
          ...attData,
        };
        return {
          ...p,
          attendances: [newRecord, ...(p.attendances || [])],
        };
      }
      return p;
    });
    saveStoredParticipants(updated);
    setParticipants(updated);

    // Salva atendimento no PostgreSQL
    addAttendanceApi(participantId, {
      date: new Date().toLocaleDateString("pt-BR"),
      eventName: attData.eventName,
      type: attData.type,
      responsible: attData.responsible,
      status: attData.status,
      summary: attData.summary,
      medicalRecordId: attData.medicalRecordId,
    })
      .then(() => refreshParticipants())
      .catch((err) => {
        console.warn("Falha ao salvar atendimento no PostgreSQL:", err.message);
      });
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
      if (counts[p.ageGroup] !== undefined) {
        counts[p.ageGroup]++;
      } else {
        counts["18–30"]++;
      }
    });

    return [
      { age: "18–30", count: counts["18–30"] },
      { age: "31–45", count: counts["31–45"] },
      { age: "46–60", count: counts["46–60"] },
      { age: "60+", count: counts["60+"] },
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
