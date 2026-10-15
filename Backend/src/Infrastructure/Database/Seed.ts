import { prisma } from "./PrismaClient";
import bcrypt from "bcryptjs";

export async function runSeed() {
  console.log("[Seed] Iniciando população do banco de dados...");

  // 1. Usuários para os 4 perfis
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    { name: "Adriane Câmara", email: "admin@promover.com", role: "admin", passwordHash },
    { name: "Lucas Lima", email: "fisio@promover.com", role: "fisioterapeuta", passwordHash },
    { name: "Camila Rocha", email: "avaliador@promover.com", role: "avaliador", passwordHash },
    { name: "Mariana Costa", email: "recepcao@promover.com", role: "recepcao", passwordHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: u,
    });
  }

  // 2. Configurações Iniciais
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      eventDate: "15/10/2026",
      eventLocation: "Farmácia Popular Santa Luzia",
      sysThreshold: 140,
      diaThreshold: 90,
      glucoseThreshold: 140,
      spo2Threshold: 92,
      hrMinThreshold: 50,
      hrMaxThreshold: 100,
    },
  });

  // 3. Eventos Comunitários
  const events = [
    {
      id: "evt-01",
      name: "Ação de Saúde: Farmácia Popular Santa Luzia",
      date: "15/10/2026",
      location: "Farmácia Popular Santa Luzia",
    },
    {
      id: "evt-02",
      name: "Ação Comunitária: Praça Central",
      date: "10/08/2026",
      location: "Praça Central - Centro",
    },
    {
      id: "evt-03",
      name: "Ação Preventiva: Centro Esportivo Esperança",
      date: "22/06/2026",
      location: "Centro Esportivo Esperança - Bairro Novo",
    },
  ];

  for (const ev of events) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: { name: ev.name, date: ev.date, location: ev.location },
      create: ev,
    });
  }

  // 4. Participantes Iniciais
  const participants = [
    {
      id: "PART-001",
      name: "Marta Ferreira",
      birthDate: "1968-04-12",
      age: 58,
      ageGroup: "46–60",
      cpf: "452.981.332-01",
      phone: "(65) 98455-8822",
      eventId: "evt-01",
    },
    {
      id: "PART-002",
      name: "Antônio Souza",
      birthDate: "1962-08-20",
      age: 64,
      ageGroup: "60+",
      cpf: "219.873.104-55",
      phone: "(65) 99123-4567",
      eventId: "evt-01",
    },
    {
      id: "PART-003",
      name: "Rosa Pereira",
      birthDate: "1979-11-05",
      age: 46,
      ageGroup: "46–60",
      cpf: "732.109.845-88",
      phone: "(65) 99872-3311",
      eventId: "evt-01",
    },
    {
      id: "PART-004",
      name: "Carlos Eduardo Mendes",
      birthDate: "1987-03-15",
      age: 39,
      ageGroup: "31–45",
      cpf: "612.394.008-12",
      phone: "(65) 99654-1122",
      eventId: "evt-01",
    },
    {
      id: "PART-005",
      name: "Lucas Gabriel Silva",
      birthDate: "2001-09-22",
      age: 25,
      ageGroup: "18–30",
      cpf: "901.442.118-90",
      phone: "(65) 99233-7744",
      eventId: "evt-01",
    },
  ];

  for (const p of participants) {
    await prisma.participant.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // 5. Histórico de Atendimentos
  const attendances = [
    {
      id: "ATT-001",
      participantId: "PART-001",
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
      participantId: "PART-001",
      date: "14/10/2026",
      eventName: "Ação Comunitária São Cristóvão",
      type: "Aferição e Acolhimento",
      responsible: "Dra. Adriane Câmara",
      status: "Atenção",
      summary: "Primeiro acolhimento comunitário. Sinais vitais aferidos, glicemia capilar de jejum elevada e orientações gerais de saúde.",
      medicalRecordId: "PR-2026-001",
    },
    {
      id: "ATT-003",
      participantId: "PART-002",
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
      participantId: "PART-002",
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
      participantId: "PART-002",
      date: "10/10/2026",
      eventName: "Studio Adriane Câmara",
      type: "Sessão Cortesia (Sessão 1)",
      responsible: "Dra. Adriane Câmara",
      status: "Concluído",
      summary: "Trabalho de mobilidade e alongamento de cadeia muscular posterior.",
      medicalRecordId: "PR-2026-002",
    },
    {
      id: "ATT-006",
      participantId: "PART-003",
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
      participantId: "PART-003",
      date: "14/10/2026",
      eventName: "Studio Adriane Câmara",
      type: "Sessão Cortesia: Avaliação Funcional",
      responsible: "Dra. Adriane Câmara",
      status: "Concluído",
      summary: "Avaliação cinético-funcional detalhada com início do protocolo de pilates terapêutico.",
      medicalRecordId: "PR-2026-003",
    },
    {
      id: "ATT-008",
      participantId: "PART-004",
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
      participantId: "PART-004",
      date: "12/10/2026",
      eventName: "Ação Comunitária Praça Central",
      type: "Orientações Posturais",
      responsible: "Fisiot. Lucas Lima",
      status: "Normal",
      summary: "Orientação preventiva para postura no trabalho e pausa ergonômica.",
      medicalRecordId: "PR-2026-004",
    },
    {
      id: "ATT-010",
      participantId: "PART-005",
      date: "15/10/2026",
      eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
      type: "Triagem de Sinais Vitais",
      responsible: "Enf. Camila Rocha",
      status: "Normal",
      summary: "PA 120/80 mmHg · SpO₂ 98%. Sinais vitais preservados, jovem sem queixas álgicas.",
      medicalRecordId: "PR-2026-005",
    },
  ];

  for (const att of attendances) {
    await prisma.attendance.upsert({
      where: { id: att.id },
      update: att,
      create: att,
    });
  }

  // 6. Triagens Recentes no Evento
  const triages = [
    {
      id: "TR-01",
      participantId: "PART-001",
      participantName: "Marta Ferreira",
      eventId: "evt-01",
      time: "14:18",
      responsible: "Enf. Camila Rocha",
      status: "Alterado",
      systolic: 142,
      diastolic: 90,
      glucose: 214,
      spo2: 97,
      heartRate: 78,
      result: "Glicemia 214 mg/dL",
    },
    {
      id: "TR-02",
      participantId: "PART-002",
      participantName: "Antônio Souza",
      eventId: "evt-01",
      time: "14:05",
      responsible: "Dra. Adriane Câmara",
      status: "Alterado",
      systolic: 152,
      diastolic: 94,
      glucose: 110,
      spo2: 96,
      heartRate: 82,
      result: "Pressão 152/94 mmHg",
    },
    {
      id: "TR-03",
      participantId: "PART-003",
      participantName: "Rosa Pereira",
      eventId: "evt-01",
      time: "13:52",
      responsible: "Fisiot. Lucas Lima",
      status: "Atenção",
      systolic: 128,
      diastolic: 82,
      glucose: 95,
      spo2: 98,
      heartRate: 72,
      result: "IMC 31,2 · Lombalgia",
    },
    {
      id: "TR-04",
      participantId: "PART-004",
      participantName: "Carlos Eduardo Mendes",
      eventId: "evt-01",
      time: "13:30",
      responsible: "Enf. Camila Rocha",
      status: "Normal",
      systolic: 118,
      diastolic: 78,
      glucose: 92,
      spo2: 99,
      heartRate: 68,
      result: "PA 118/78 · Glicemia 92",
    },
    {
      id: "TR-05",
      participantId: null,
      participantName: "José de Alencar",
      eventId: "evt-01",
      time: "13:10",
      responsible: "Dra. Adriane Câmara",
      status: "Normal",
      systolic: 120,
      diastolic: 80,
      glucose: 89,
      spo2: 98,
      heartRate: 70,
      result: "Parâmetros Normais",
    },
  ];

  for (const tr of triages) {
    await prisma.triage.upsert({
      where: { id: tr.id },
      update: tr,
      create: tr,
    });
  }

  // 7. Prontuários Clínicos
  const medicalRecords = [
    {
      id: "PR-2026-001",
      participantId: "PART-001",
      name: "Marta Ferreira",
      age: 58,
      date: "15/10/2026",
      status: "Alterado",
      pressure: "142/90 mmHg",
      glucose: "214 mg/dL",
      spo2: "97%",
      heartRate: "78 bpm",
      note: "Glicemia de jejum elevada detectada na triagem comunitária (214 mg/dL). Participante orientada sobre controle glicêmico, hábitos alimentares e encaminhada para acompanhamento médico com endocrinologista.",
      tone: "danger",
    },
    {
      id: "PR-2026-002",
      participantId: "PART-002",
      name: "Antônio Souza",
      age: 64,
      date: "15/10/2026",
      status: "Atenção",
      pressure: "152/94 mmHg",
      glucose: "110 mg/dL",
      spo2: "96%",
      heartRate: "82 bpm",
      note: "Pressão arterial sistólica elevada em primeira medição. Após 15 minutos de repouso, manteve-se em 148/90 mmHg. Concedidas 2 sessões cortesia para trabalho de mobilidade e exercícios leves no Studio.",
      tone: "warning",
    },
    {
      id: "PR-2026-003",
      participantId: "PART-003",
      name: "Rosa Pereira",
      age: 46,
      date: "15/10/2026",
      status: "Acompanhamento",
      pressure: "128/82 mmHg",
      glucose: "95 mg/dL",
      spo2: "98%",
      heartRate: "72 bpm",
      note: "IMC 31,2. Queixa álgica recorrente em coluna lombar agravada por permanecer longos períodos em pé. Encaminhada para avaliação funcional da fisioterapia com 4 sessões cortesia concedidas.",
      tone: "info",
    },
    {
      id: "PR-2026-004",
      participantId: "PART-004",
      name: "Carlos Eduardo Mendes",
      age: 39,
      date: "15/10/2026",
      status: "Normal",
      pressure: "118/78 mmHg",
      glucose: "92 mg/dL",
      spo2: "99%",
      heartRate: "68 bpm",
      note: "Sinais vitais normais e estáveis. Queixa esporádica de tensão em trapézios por trabalho contínuo em computador. Recebeu cartilha de exercícios ergonômicos e pausas ativas.",
      tone: "success",
    },
    {
      id: "PR-2026-005",
      participantId: "PART-005",
      name: "Lucas Gabriel Silva",
      age: 25,
      date: "15/10/2026",
      status: "Normal",
      pressure: "120/80 mmHg",
      glucose: "88 mg/dL",
      spo2: "98%",
      heartRate: "70 bpm",
      note: "Sinais vitais fisiológicos. Jovem assintomático, orientado sobre importância da atividade física regular e hidratação.",
      tone: "success",
    },
  ];

  for (const mr of medicalRecords) {
    await prisma.medicalRecord.upsert({
      where: { id: mr.id },
      update: mr,
      create: mr,
    });
  }

  // 8. Sessões Cortesia
  const courtesyConcessions = [
    {
      id: "C-001",
      participantId: "PART-003",
      triageId: "TR-03",
      date: "13/10/2026",
      sessions: 4,
      reason: "Encaminhamento pós-triagem (IMC 31,2 e queixa álgica em coluna lombar)",
    },
    {
      id: "C-002",
      participantId: "PART-002",
      triageId: "TR-02",
      date: "08/10/2026",
      sessions: 2,
      reason: "Avaliação postural e funcional complementar",
    },
    {
      id: "C-003",
      participantId: "PART-001",
      triageId: "TR-01",
      date: "14/10/2026",
      sessions: 2,
      reason: "Orientações ergonômicas e exercícios de baixo impacto",
    },
  ];

  for (const cc of courtesyConcessions) {
    await prisma.courtesyRecord.upsert({
      where: { id: cc.id },
      update: cc,
      create: cc,
    });
  }

  const courtesyUsages = [
    {
      id: "U-001",
      courtesyRecordId: "C-001",
      date: "14/10/2026",
      type: "Avaliação Funcional Inicial",
      professional: "Dra. Adriane Câmara (Fisioterapeuta)",
      status: "Realizado",
    },
    {
      id: "U-002",
      courtesyRecordId: "C-002",
      date: "10/10/2026",
      type: "Sessão 1: Mobilidade e Alongamento",
      professional: "Dra. Adriane Câmara (Fisioterapeuta)",
      status: "Realizado",
    },
    {
      id: "U-003",
      courtesyRecordId: "C-002",
      date: "12/10/2026",
      type: "Sessão 2: Estabilidade e Exercícios Posturais",
      professional: "Dra. Adriane Câmara (Fisioterapeuta)",
      status: "Realizado",
    },
  ];

  for (const cu of courtesyUsages) {
    await prisma.courtesyUtilization.upsert({
      where: { id: cu.id },
      update: cu,
      create: cu,
    });
  }

  console.log("[Seed] População concluída com sucesso no PostgreSQL!");
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Erro na execução:", err);
      process.exit(1);
    });
}
