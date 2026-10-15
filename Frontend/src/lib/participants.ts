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
  type: string; // "Triagem de Sinais Vitais" | "Avaliação Funcional" | "Sessão Cortesia" | "Orientações Posturais"
  responsible: string;
  summary: string;
  status: "Normal" | "Atenção" | "Alterado" | "Concluído";
  medicalRecordId?: string; // Ex: "PR-2026-001"
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

// Participantes iniciais com histórico realista de atendimentos
export const SEED_PARTICIPANTS: Participant[] = [
  {
    id: "PART-001",
    name: "Marta Ferreira",
    birthDate: "1968-04-12",
    age: calculateAge("1968-04-12")?.age || 58,
    ageGroup: "46–60",
    cpf: "452.981.332-01",
    phone: "(65) 98455-8822",
    eventId: "evt-01",
    createdAt: "15/10/2026",
    attendances: [
      {
        id: "ATT-001",
        date: "15/10/2026",
        eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
        type: "Triagem de Sinais Vitais",
        responsible: "Enf. Camila Rocha",
        status: "Alterado",
        summary: "Glicemia alterada detectada na triagem (214 mg/dL). Encaminhada para avaliação endocrinológica e suporte com nutricionista.",
        medicalRecordId: "PR-2026-001",
      },
      {
        id: "ATT-002",
        date: "14/10/2026",
        eventName: "Ação Comunitária São Cristóvão",
        type: "Aferição e Acolhimento",
        responsible: "Dra. Adriane Câmara",
        status: "Atenção",
        summary: "Primeiro acolhimento comunitário. Sinais vitais aferidos, glicemia capilar de jejum elevada e orientações gerais de saúde.",
        medicalRecordId: "PR-2026-001",
      },
    ],
  },
  {
    id: "PART-002",
    name: "Antônio Souza",
    birthDate: "1962-08-20",
    age: calculateAge("1962-08-20")?.age || 64,
    ageGroup: "60+",
    cpf: "219.873.104-55",
    phone: "(65) 99123-4567",
    eventId: "evt-01",
    createdAt: "15/10/2026",
    attendances: [
      {
        id: "ATT-003",
        date: "15/10/2026",
        eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
        type: "Triagem de Sinais Vitais",
        responsible: "Dra. Adriane Câmara",
        status: "Alterado",
        summary: "Pressão arterial sistólica elevada (152/94 mmHg). Reavaliação pós-repouso realizada com oximetria 96%.",
        medicalRecordId: "PR-2026-002",
      },
      {
        id: "ATT-004",
        date: "12/10/2026",
        eventName: "Studio Adriane Câmara",
        type: "Sessão Cortesia (Sessão 2)",
        responsible: "Dra. Adriane Câmara",
        status: "Concluído",
        summary: "Treino de estabilidade articular e exercícios posturais funcionais realizados com ótima resposta.",
        medicalRecordId: "PR-2026-002",
      },
      {
        id: "ATT-005",
        date: "10/10/2026",
        eventName: "Studio Adriane Câmara",
        type: "Sessão Cortesia (Sessão 1)",
        responsible: "Dra. Adriane Câmara",
        status: "Concluído",
        summary: "Trabalho de mobilidade e alongamento de cadeia muscular posterior.",
        medicalRecordId: "PR-2026-002",
      },
    ],
  },
  {
    id: "PART-003",
    name: "Rosa Pereira",
    birthDate: "1979-11-05",
    age: calculateAge("1979-11-05")?.age || 46,
    ageGroup: "46–60",
    cpf: "732.109.845-88",
    phone: "(65) 99872-3311",
    eventId: "evt-01",
    createdAt: "15/10/2026",
    attendances: [
      {
        id: "ATT-006",
        date: "15/10/2026",
        eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
        type: "Triagem e Avaliação Funcional",
        responsible: "Fisiot. Lucas Lima",
        status: "Atenção",
        summary: "IMC 31,2 com queixas de dor lombar mecânica ao permanecer em pé. Concedidas 4 sessões cortesia.",
        medicalRecordId: "PR-2026-003",
      },
      {
        id: "ATT-007",
        date: "14/10/2026",
        eventName: "Studio Adriane Câmara",
        type: "Sessão Cortesia: Avaliação Funcional",
        responsible: "Dra. Adriane Câmara",
        status: "Concluído",
        summary: "Avaliação cinético-funcional detalhada com início do protocolo de pilates terapêutico.",
        medicalRecordId: "PR-2026-003",
      },
    ],
  },
  {
    id: "PART-004",
    name: "Carlos Eduardo Mendes",
    birthDate: "1987-03-15",
    age: calculateAge("1987-03-15")?.age || 39,
    ageGroup: "31–45",
    cpf: "612.394.008-12",
    phone: "(65) 99654-1122",
    eventId: "evt-01",
    createdAt: "15/10/2026",
    attendances: [
      {
        id: "ATT-008",
        date: "15/10/2026",
        eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
        type: "Triagem de Sinais Vitais",
        responsible: "Enf. Camila Rocha",
        status: "Normal",
        summary: "PA 118/78 mmHg · Glicemia 92 mg/dL. Todos os parâmetros vitais dentro da normalidade.",
        medicalRecordId: "PR-2026-004",
      },
      {
        id: "ATT-009",
        date: "12/10/2026",
        eventName: "Ação Comunitária Praça Central",
        type: "Orientações Posturais",
        responsible: "Fisiot. Lucas Lima",
        status: "Normal",
        summary: "Orientação preventiva para postura no trabalho e pausa ergonômica.",
        medicalRecordId: "PR-2026-004",
      },
    ],
  },
  {
    id: "PART-005",
    name: "Lucas Gabriel Silva",
    birthDate: "2001-09-22",
    age: calculateAge("2001-09-22")?.age || 25,
    ageGroup: "18–30",
    cpf: "901.442.118-90",
    phone: "(65) 99233-7744",
    eventId: "evt-01",
    createdAt: "15/10/2026",
    attendances: [
      {
        id: "ATT-010",
        date: "15/10/2026",
        eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
        type: "Triagem de Sinais Vitais",
        responsible: "Enf. Camila Rocha",
        status: "Normal",
        summary: "PA 120/80 mmHg · SpO₂ 98%. Sinais vitais preservados, jovem sem queixas álgicas.",
        medicalRecordId: "PR-2026-005",
      },
    ],
  },
];

export function getStoredParticipants(): Participant[] {
  if (typeof window === "undefined") return SEED_PARTICIPANTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PARTICIPANTS));
      return SEED_PARTICIPANTS;
    }
    const parsed = JSON.parse(raw);
    // Garantir retrocompatibilidade e presença de attendances em itens antigos do cache
    return parsed.map((p: any) => {
      const seed = SEED_PARTICIPANTS.find((sp) => sp.id === p.id);
      return {
        ...p,
        attendances:
          Array.isArray(p.attendances) && p.attendances.length > 0
            ? p.attendances
            : seed?.attendances || [
                {
                  id: `ATT-INIT-${p.id}`,
                  date: p.createdAt || "15/10/2026",
                  eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
                  type: "Cadastro e Acolhimento Comunitário",
                  responsible: "Equipe PRO-MOVER",
                  status: "Concluído",
                  summary: "Participante acolhido e cadastrado para acompanhamento na ação comunitária.",
                  medicalRecordId: `PR-${p.id}`,
                },
              ],
      };
    });
  } catch {
    return SEED_PARTICIPANTS;
  }
}

export function saveStoredParticipants(data: Participant[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("pro_mover_participants_change"));
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>(getStoredParticipants);

  // Sincroniza com o banco de dados PostgreSQL ao montar
  useEffect(() => {
    getParticipantsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          saveStoredParticipants(data);
          setParticipants(data);
        }
      })
      .catch((err) => {
        // Fallback resiliente para o cache local
        console.warn("Backend offline ou iniciando, usando dados locais:", err.message);
      });
  }, []);

  useEffect(() => {
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
    const eventLabel = newP.eventName || "Ação de Saúde: Farmácia Popular Santa Luzia";

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
          summary: "Cadastro inicial registrado. Participante elegível para triagem de sinais vitais e prontuário clínico.",
          medicalRecordId: `PR-${newId}`,
        },
      ],
    };

    const current = getStoredParticipants();
    const updated = [participant, ...current];
    saveStoredParticipants(updated);
    setParticipants(updated);

    // Salva no PostgreSQL de forma assíncrona
    createParticipantApi({
      name: participant.name,
      birthDate: participant.birthDate,
      age: participant.age,
      ageGroup: participant.ageGroup,
      cpf: participant.cpf,
      phone: participant.phone,
      eventId: participant.eventId,
    }).catch((err) => {
      console.warn("Falha ao sincronizar participante com PostgreSQL:", err.message);
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

    // Salva atendimento no PostgreSQL de forma assíncrona
    addAttendanceApi(participantId, {
      date: new Date().toLocaleDateString("pt-BR"),
      eventName: attData.eventName,
      type: attData.type,
      responsible: attData.responsible,
      status: attData.status,
      summary: attData.summary,
      medicalRecordId: attData.medicalRecordId,
    }).catch((err) => {
      console.warn("Falha ao sincronizar atendimento com PostgreSQL:", err.message);
    });
  };

  // Calcula a distribuição etária dinamicamente para o evento selecionado
  const getAgeDistribution = (eventId: string, baseGroupCounts: { age: string; count: number }[]) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);

    const counts: Record<string, number> = {
      "18–30": 0,
      "31–45": 0,
      "46–60": 0,
      "60+": 0,
    };

    baseGroupCounts.forEach((bg) => {
      if (counts[bg.age] !== undefined) {
        counts[bg.age] = bg.count;
      }
    });

    const extraParticipants = eventParticipants.filter(
      (p) => !SEED_PARTICIPANTS.some((sp) => sp.id === p.id)
    );

    extraParticipants.forEach((p) => {
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

  // Contagem de participantes extras por evento
  const getExtraCount = (eventId: string) => {
    return participants.filter(
      (p) => p.eventId === eventId && !SEED_PARTICIPANTS.some((sp) => sp.id === p.id)
    ).length;
  };

  return {
    participants,
    addParticipant,
    addAttendance,
    getAgeDistribution,
    getExtraCount,
  };
}
