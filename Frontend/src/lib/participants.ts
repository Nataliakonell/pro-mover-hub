import { useState, useEffect } from "react";

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
  if (age < 18) group = "18–30"; // aloca na primeira faixa para efeitos da distribuição
  else if (age <= 30) group = "18–30";
  else if (age <= 45) group = "31–45";
  else if (age <= 60) group = "46–60";
  else group = "60+";

  return { age, group };
}

// Participantes iniciais vinculados aos eventos
const SEED_PARTICIPANTS: Participant[] = [
  // Evento 1
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
    return JSON.parse(raw);
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
  }): Participant => {
    const ageInfo = calculateAge(newP.birthDate) || { age: 0, group: "18–30" };
    const participant: Participant = {
      id: `PART-${Date.now().toString().slice(-4)}`,
      name: newP.name.trim(),
      birthDate: newP.birthDate,
      age: ageInfo.age,
      ageGroup: ageInfo.group,
      cpf: newP.cpf,
      phone: newP.phone,
      eventId: newP.eventId,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    const current = getStoredParticipants();
    const updated = [participant, ...current];
    saveStoredParticipants(updated);
    setParticipants(updated);
    return participant;
  };

  // Calcula a distribuição etária dinamicamente para o evento selecionado
  const getAgeDistribution = (eventId: string, baseGroupCounts: { age: string; count: number }[]) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);

    // Se houver participantes cadastrados pelo usuário além dos do seed inicial
    const counts: Record<string, number> = {
      "18–30": 0,
      "31–45": 0,
      "46–60": 0,
      "60+": 0,
    };

    // Preenche com a base do evento
    baseGroupCounts.forEach((bg) => {
      if (counts[bg.age] !== undefined) {
        counts[bg.age] = bg.count;
      }
    });

    // Adiciona participantes extras cadastrados via tela (que não estavam no seed base)
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
    getAgeDistribution,
    getExtraCount,
  };
}
