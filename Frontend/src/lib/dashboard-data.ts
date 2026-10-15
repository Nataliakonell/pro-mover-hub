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

export const EVENTS_DATA: DashboardEvent[] = [
  {
    id: "evt-01",
    name: "Ação de Saúde: Farmácia Popular Santa Luzia",
    date: "15/10/2026",
    location: "Farmácia Popular Santa Luzia",
    metrics: {
      attended: 28,
      triagesDone: 24,
      alteredTriages: 7,
      referrals: 5,
      courtesyGranted: 6,
      scheduledToday: 4,
    },
    charts: {
      ageGroups: [
        { age: "18–30", count: 4 },
        { age: "31–45", count: 8 },
        { age: "46–60", count: 11 },
        { age: "60+", count: 5 },
      ],
      examResults: [
        { name: "Dentro dos parâmetros", percentage: 71, color: "var(--color-primary)" },
        { name: "Com alterações", percentage: 29, color: "var(--color-warning)" },
      ],
      servicesDist: [
        { name: "Triagem Sinais", count: 14 },
        { name: "Avaliação Funcional", count: 6 },
        { name: "Orientações Posturais", count: 8 },
      ],
      examAlterations: [
        { exam: "Pressão Arterial", count: 4 },
        { exam: "Glicemia", count: 2 },
        { exam: "IMC Elevado", count: 3 },
        { exam: "SpO₂ Baixa", count: 1 },
      ],
      eventEvolution: [
        { event: "Ação 1", atendimentos: 18 },
        { event: "Ação 2", atendimentos: 22 },
        { event: "Ação 3", atendimentos: 25 },
        { event: "Atual", atendimentos: 28 },
      ],
      referrals: [
        { destination: "Studio Adriane Câmara", count: 3, color: "#1b806a" },
        { destination: "Clínico Geral / UBS", count: 2, color: "#0ea5e9" },
        { destination: "Nutrição", count: 1, color: "#eab308" },
      ],
    },
    recentTriages: [
      {
        id: "TR-01",
        participant: "Marta Ferreira",
        time: "14:18",
        responsible: "Enf. Camila Rocha",
        status: "Alterado",
        result: "Glicemia 214 mg/dL",
      },
      {
        id: "TR-02",
        participant: "Antônio Souza",
        time: "14:05",
        responsible: "Dra. Adriane Câmara",
        status: "Alterado",
        result: "Pressão 152/94 mmHg",
      },
      {
        id: "TR-03",
        participant: "Rosa Pereira",
        time: "13:52",
        responsible: "Fisiot. Lucas Lima",
        status: "Atenção",
        result: "IMC 31,2 · Lombalgia",
      },
      {
        id: "TR-04",
        participant: "Carlos Eduardo Mendes",
        time: "13:30",
        responsible: "Enf. Camila Rocha",
        status: "Normal",
        result: "PA 118/78 · Glicemia 92",
      },
      {
        id: "TR-05",
        participant: "José de Alencar",
        time: "13:10",
        responsible: "Dra. Adriane Câmara",
        status: "Normal",
        result: "PA 122/80 · SpO₂ 98%",
      },
    ],
  },
  {
    id: "evt-02",
    name: "Mutirão Comunitário: Praça Central",
    date: "28/09/2026",
    location: "Praça Central - Tenda da Saúde",
    metrics: {
      attended: 45,
      triagesDone: 39,
      alteredTriages: 12,
      referrals: 8,
      courtesyGranted: 10,
      scheduledToday: 6,
    },
    charts: {
      ageGroups: [
        { age: "18–30", count: 9 },
        { age: "31–45", count: 14 },
        { age: "46–60", count: 15 },
        { age: "60+", count: 7 },
      ],
      examResults: [
        { name: "Dentro dos parâmetros", percentage: 69, color: "var(--color-primary)" },
        { name: "Com alterações", percentage: 31, color: "var(--color-warning)" },
      ],
      servicesDist: [
        { name: "Triagem Sinais", count: 22 },
        { name: "Avaliação Funcional", count: 11 },
        { name: "Orientações Posturais", count: 12 },
      ],
      examAlterations: [
        { exam: "Pressão Arterial", count: 7 },
        { exam: "Glicemia", count: 4 },
        { exam: "IMC Elevado", count: 5 },
        { exam: "SpO₂ Baixa", count: 2 },
      ],
      eventEvolution: [
        { event: "Ação 1", atendimentos: 20 },
        { event: "Ação 2", atendimentos: 32 },
        { event: "Ação 3", atendimentos: 38 },
        { event: "Atual", atendimentos: 45 },
      ],
      referrals: [
        { destination: "Studio Adriane Câmara", count: 5, color: "#1b806a" },
        { destination: "Clínico Geral / UBS", count: 3, color: "#0ea5e9" },
        { destination: "Nutrição", count: 2, color: "#eab308" },
      ],
    },
    recentTriages: [
      {
        id: "TR-21",
        participant: "Helena Ramos",
        time: "16:45",
        responsible: "Dra. Adriane Câmara",
        status: "Normal",
        result: "PA 115/75 · Glicemia 88",
      },
      {
        id: "TR-22",
        participant: "Benedito Gomes",
        time: "16:30",
        responsible: "Enf. Camila Rocha",
        status: "Alterado",
        result: "Pressão 160/100 mmHg",
      },
      {
        id: "TR-23",
        participant: "Clarice Antunes",
        time: "16:15",
        responsible: "Fisiot. Lucas Lima",
        status: "Atenção",
        result: "IMC 29,8 · Dor cervical",
      },
      {
        id: "TR-24",
        participant: "Marcos Vinicius",
        time: "15:50",
        responsible: "Dra. Adriane Câmara",
        status: "Normal",
        result: "PA 120/80 · SpO₂ 99%",
      },
      {
        id: "TR-25",
        participant: "Tereza Cristina",
        time: "15:20",
        responsible: "Enf. Camila Rocha",
        status: "Alterado",
        result: "Glicemia 198 mg/dL",
      },
    ],
  },
  {
    id: "evt-03",
    name: "Ação Social: Centro Comunitário São José",
    date: "12/08/2026",
    location: "Centro Social São José",
    metrics: {
      attended: 34,
      triagesDone: 31,
      alteredTriages: 8,
      referrals: 6,
      courtesyGranted: 8,
      scheduledToday: 3,
    },
    charts: {
      ageGroups: [
        { age: "18–30", count: 6 },
        { age: "31–45", count: 10 },
        { age: "46–60", count: 12 },
        { age: "60+", count: 6 },
      ],
      examResults: [
        { name: "Dentro dos parâmetros", percentage: 74, color: "var(--color-primary)" },
        { name: "Com alterações", percentage: 26, color: "var(--color-warning)" },
      ],
      servicesDist: [
        { name: "Triagem Sinais", count: 18 },
        { name: "Avaliação Funcional", count: 8 },
        { name: "Orientações Posturais", count: 8 },
      ],
      examAlterations: [
        { exam: "Pressão Arterial", count: 5 },
        { exam: "Glicemia", count: 3 },
        { exam: "IMC Elevado", count: 4 },
        { exam: "SpO₂ Baixa", count: 1 },
      ],
      eventEvolution: [
        { event: "Ação 1", atendimentos: 15 },
        { event: "Ação 2", atendimentos: 24 },
        { event: "Ação 3", atendimentos: 30 },
        { event: "Atual", atendimentos: 34 },
      ],
      referrals: [
        { destination: "Studio Adriane Câmara", count: 4, color: "#1b806a" },
        { destination: "Clínico Geral / UBS", count: 3, color: "#0ea5e9" },
        { destination: "Nutrição", count: 1, color: "#eab308" },
      ],
    },
    recentTriages: [
      {
        id: "TR-41",
        participant: "Severino Silva",
        time: "15:10",
        responsible: "Dra. Adriane Câmara",
        status: "Alterado",
        result: "Pressão 148/92 mmHg",
      },
      {
        id: "TR-42",
        participant: "Maria de Lourdes",
        time: "14:50",
        responsible: "Fisiot. Lucas Lima",
        status: "Atenção",
        result: "IMC 30,5 · Gonartrose",
      },
      {
        id: "TR-43",
        participant: "Joaquim Barbosa",
        time: "14:25",
        responsible: "Enf. Camila Rocha",
        status: "Normal",
        result: "PA 120/80 · Glicemia 95",
      },
      {
        id: "TR-44",
        participant: "Francisca Nogueira",
        time: "13:55",
        responsible: "Dra. Adriane Câmara",
        status: "Alterado",
        result: "Glicemia 205 mg/dL",
      },
      {
        id: "TR-45",
        participant: "Geraldo Magela",
        time: "13:20",
        responsible: "Enf. Camila Rocha",
        status: "Normal",
        result: "PA 124/82 · SpO₂ 97%",
      },
    ],
  },
];
