import { useState, useEffect } from "react";
import { getCourtesyRecordsApi, scheduleCourtesyApi } from "./api";

export interface CourtesyConcession {
  id: string;
  triageId: string;
  date: string;
  sessions: number; // Regra: até 4 sessões por triagem
  reason: string;
}

export interface CourtesyUtilization {
  id: string;
  date: string;
  type: string;
  professional: string;
  status: "Realizado" | "Agendado" | "Cancelado";
}

export interface ParticipantCourtesy {
  id: string;
  name: string;
  concessions: CourtesyConcession[];
  utilizations: CourtesyUtilization[];
}

const STORAGE_KEY = "pro_mover_courtesy_records";

const INITIAL_DATA: ParticipantCourtesy[] = [
  {
    id: "P-001",
    name: "Rosa Pereira",
    concessions: [
      {
        id: "C-001",
        triageId: "TR-101",
        date: "13/10/2026",
        sessions: 4,
        reason: "Encaminhamento pós-triagem (IMC 31,2 e queixa álgica em coluna lombar)",
      },
    ],
    utilizations: [
      {
        id: "U-001",
        date: "14/10/2026",
        type: "Avaliação Funcional Inicial",
        professional: "Dra. Adriane Câmara (Fisioterapeuta)",
        status: "Realizado",
      },
    ],
  },
  {
    id: "P-002",
    name: "Antônio Souza",
    concessions: [
      {
        id: "C-002",
        triageId: "TR-102",
        date: "08/10/2026",
        sessions: 2,
        reason: "Avaliação postural e funcional complementar",
      },
    ],
    utilizations: [
      {
        id: "U-002",
        date: "10/10/2026",
        type: "Sessão 1: Mobilidade e Alongamento",
        professional: "Dra. Adriane Câmara (Fisioterapeuta)",
        status: "Realizado",
      },
      {
        id: "U-003",
        date: "12/10/2026",
        type: "Sessão 2: Estabilidade e Exercícios Posturais",
        professional: "Dra. Adriane Câmara (Fisioterapeuta)",
        status: "Realizado",
      },
    ],
  },
  {
    id: "P-003",
    name: "Marta Ferreira",
    concessions: [
      {
        id: "C-003",
        triageId: "TR-103",
        date: "14/10/2026",
        sessions: 2,
        reason: "Orientações ergonômicas e exercícios de baixo impacto",
      },
    ],
    utilizations: [],
  },
];

// Cálculo compartilhado do saldo do participante
export function calculateBalance(participant: ParticipantCourtesy) {
  // Concedidas: soma de sessions de todas as triagens concluídas
  const granted = participant.concessions.reduce((acc, c) => acc + c.sessions, 0);

  // Utilizadas: registros marcados como "Realizado"
  const used = participant.utilizations.filter((u) => u.status === "Realizado").length;

  // Restantes: concedidas menos utilizadas
  const remaining = Math.max(0, granted - used);

  return {
    granted,
    used,
    remaining,
    status: remaining > 0 ? ("Ativo" as const) : ("Esgotado" as const),
  };
}

export function getStoredCourtesy(): ParticipantCourtesy[] {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DATA;
  }
}

export function saveStoredCourtesy(data: ParticipantCourtesy[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("pro_mover_courtesy_change"));
}

export function useCourtesy() {
  const [participants, setParticipants] = useState<ParticipantCourtesy[]>(getStoredCourtesy);

  // Sincroniza com PostgreSQL ao carregar
  useEffect(() => {
    getCourtesyRecordsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          saveStoredCourtesy(data);
          setParticipants(data);
        }
      })
      .catch((err) => {
        console.warn("Backend offline ou iniciando, usando dados locais de cortesia:", err.message);
      });
  }, []);

  useEffect(() => {
    const handler = () => {
      setParticipants(getStoredCourtesy());
    };
    window.addEventListener("pro_mover_courtesy_change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("pro_mover_courtesy_change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Adicionar agendamento/utilização
  const scheduleSession = (
    participantId: string,
    sessionData: Omit<CourtesyUtilization, "id">
  ) => {
    const current = getStoredCourtesy();
    const targetParticipant = current.find((p) => p.id === participantId);
    const courtesyRecordId = targetParticipant?.concessions[0]?.id || "C-001";

    const updated = current.map((p) => {
      if (p.id !== participantId) return p;
      return {
        ...p,
        utilizations: [
          ...p.utilizations,
          {
            ...sessionData,
            id: `U-${Date.now()}`,
          },
        ],
      };
    });
    saveStoredCourtesy(updated);
    setParticipants(updated);

    // Salva no PostgreSQL de forma assíncrona
    scheduleCourtesyApi({
      courtesyRecordId,
      date: sessionData.date,
      type: sessionData.type,
      professional: sessionData.professional,
      status: sessionData.status,
    }).catch((err) => {
      console.warn("Falha ao salvar utilização de cortesia no backend:", err.message);
    });
  };

  // Conceder novas sessões (máximo 4 por triagem)
  const grantSessions = (
    participantId: string,
    sessions: number,
    reason: string
  ) => {
    const validSessions = Math.min(Math.max(1, Number(sessions)), 4);
    const current = getStoredCourtesy();
    const updated = current.map((p) => {
      if (p.id !== participantId) return p;
      return {
        ...p,
        concessions: [
          ...p.concessions,
          {
            id: `C-${Date.now()}`,
            triageId: `TR-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString("pt-BR"),
            sessions: validSessions,
            reason,
          },
        ],
      };
    });
    saveStoredCourtesy(updated);
    setParticipants(updated);
  };

  // Filtra apenas participantes com concedidas > 0
  const eligibleParticipants = participants.filter((p) => {
    const { granted } = calculateBalance(p);
    return granted > 0;
  });

  return {
    participants: eligibleParticipants,
    allParticipants: participants,
    calculateBalance,
    scheduleSession,
    grantSessions,
  };
}
