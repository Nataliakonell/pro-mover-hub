import { useState, useEffect } from "react";
import { getCourtesyRecordsApi, scheduleCourtesyApi, concedeCourtesyApi } from "./api";

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

// Cálculo compartilhado do saldo do participante
export function calculateBalance(participant: ParticipantCourtesy) {
  // Concedidas: soma de sessions de todas as triagens concluídas
  const granted = participant.concessions?.reduce((acc, c) => acc + c.sessions, 0) || 0;

  // Utilizadas: registros marcados como "Realizado"
  const used = participant.utilizations?.filter((u) => u.status === "Realizado").length || 0;

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

export function saveStoredCourtesy(data: ParticipantCourtesy[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("pro_mover_courtesy_change"));
}

export function useCourtesy() {
  const [participants, setParticipants] = useState<ParticipantCourtesy[]>(getStoredCourtesy);

  const refreshCourtesy = async () => {
    try {
      const data = await getCourtesyRecordsApi();
      if (Array.isArray(data)) {
        saveStoredCourtesy(data);
        setParticipants(data);
      }
    } catch (err: any) {
      console.warn("Backend offline ou iniciando, usando dados locais de cortesia:", err.message);
    }
  };

  useEffect(() => {
    refreshCourtesy();

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
          ...(p.utilizations || []),
          {
            ...sessionData,
            id: `U-${Date.now()}`,
          },
        ],
      };
    });
    saveStoredCourtesy(updated);
    setParticipants(updated);

    // Salva no PostgreSQL
    scheduleCourtesyApi({
      courtesyRecordId,
      date: sessionData.date,
      type: sessionData.type,
      professional: sessionData.professional,
      status: sessionData.status,
    })
      .then(() => refreshCourtesy())
      .catch((err) => {
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
          ...(p.concessions || []),
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

    concedeCourtesyApi({
      participantId,
      sessions: validSessions,
      reason,
    })
      .then(() => refreshCourtesy())
      .catch((err) => {
        console.warn("Falha ao conceder sessões no PostgreSQL:", err.message);
      });
  };

  return {
    participants,
    calculateBalance,
    scheduleSession,
    grantSessions,
    refreshCourtesy,
  };
}
