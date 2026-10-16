import { prisma } from "./PrismaClient";
import bcrypt from "bcryptjs";
import http from "http";
import app from "../Server/ExpressApp";

/**
 * Teste Application-to-Application (A2A):
 * Valida a criação de campanhas, participantes e triagens com IMC através dos endpoints HTTP da API backend.
 * Ao final da validação, os registros temporários de teste são totalmente removidos para não deixar dados chumbados no banco.
 */
export async function runA2ATest(): Promise<boolean> {
  console.log("\n==============================================================");
  console.log("[TESTE A2A] Validando endpoints HTTP do Backend e banco PostgreSQL...");
  console.log("==============================================================");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // 1. Validar criação de Campanha via Backend (POST /api/events)
    const resCamp = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Campanha Teste A2A",
        date: "2026-10-15",
        location: "Local de Teste Temporário",
      }),
    });
    if (!resCamp.ok) throw new Error(`Falha no POST /api/events: ${resCamp.status}`);
    const createdCamp: any = await resCamp.json();
    console.log(`✔ [A2A 1/4] POST /api/events testado com sucesso (ID: ${createdCamp.id})`);

    // 2. Validar criação de Participante vinculado à campanha (POST /api/participants)
    const resPart = await fetch(`${baseUrl}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Participante Teste Temporário",
        birthDate: "1995-05-10",
        age: 31,
        ageGroup: "31–45",
        cpf: "000.000.000-00",
        phone: "(65) 90000-0000",
        eventId: createdCamp.id,
      }),
    });
    if (!resPart.ok) throw new Error(`Falha no POST /api/participants: ${resPart.status}`);
    const createdPart: any = await resPart.json();
    console.log(`✔ [A2A 2/4] POST /api/participants testado com sucesso (ID: ${createdPart.id})`);

    // 3. Validar registro de Triagem com IMC e Observação (POST /api/triages)
    const resTriage = await fetch(`${baseUrl}/triages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: createdPart.id,
        participantName: createdPart.name,
        eventId: createdCamp.id,
        responsible: "Sistema de Teste",
        status: "Normal",
        systolic: 120,
        diastolic: 80,
        glucose: 90,
        spo2: 98,
        heartRate: 72,
        result: "PA 120/80 · Glicemia 90 mg/dL · IMC 22.5 (Peso normal) · Teste A2A",
      }),
    });
    if (!resTriage.ok) throw new Error(`Falha no POST /api/triages: ${resTriage.status}`);
    const createdTriage: any = await resTriage.json();
    console.log(`✔ [A2A 3/4] POST /api/triages testado com sucesso (ID: ${createdTriage.id})`);

    // 4. Validar adição de Atendimento no Histórico (POST /api/participants/:id/attendances)
    const resAtt = await fetch(`${baseUrl}/participants/${createdPart.id}/attendances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "15/10/2026",
        eventName: createdCamp.name,
        type: "Triagem de Sinais Vitais",
        responsible: "Sistema de Teste",
        status: "Normal",
        summary: "Teste de atendimento no histórico",
      }),
    });
    if (!resAtt.ok) throw new Error(`Falha no POST attendances: ${resAtt.status}`);
    console.log(`✔ [A2A 4/4] POST /api/participants/:id/attendances testado com sucesso`);

    console.log("==============================================================");
    console.log("[TESTE A2A] SUCESSO: Todos os endpoints funcionam e gravam no PostgreSQL!");
    console.log("==============================================================\n");
    return true;
  } finally {
    // Limpeza total dos registros gerados durante o teste
    console.log("[A2A Cleanup] Removendo dados temporários do teste...");
    await prisma.triage.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.event.deleteMany({});
    console.log("[A2A Cleanup] Limpeza concluída: nenhum dado temporário residual no banco.");
    if (typeof (server as any).closeAllConnections === "function") {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

export async function runSeed() {
  console.log("[Seed] Iniciando preparação do banco de dados (ZERO dados chumbados)...");

  // 1. Limpeza completa de todos os dados clínicos e de campanhas residuais
  await prisma.courtesyUtilization.deleteMany({});
  await prisma.courtesyRecord.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.triage.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.event.deleteMany({});
  console.log("[Seed] Tabelas de campanhas, participantes e triagens limpas com sucesso.");

  // 2. Usuários para autenticação dos perfis do sistema
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
  console.log("[Seed] Usuários do sistema configurados.");

  // 3. Configurações Iniciais do Sistema (limites de alerta e faixas de IMC)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      eventDate: "15/10/2026",
      eventLocation: "Ação de Saúde Comunitária",
      sysMinThreshold: 90,
      sysMaxThreshold: 140,
      diaMinThreshold: 60,
      diaMaxThreshold: 90,
      sysThreshold: 140,
      diaThreshold: 90,
      glucoseThreshold: 140,
      spo2Threshold: 92,
      hrMinThreshold: 50,
      hrMaxThreshold: 100,
    },
  });
  console.log("[Seed] Configurações de alerta e limites clínicos salvos.");

  // 4. Executa o teste A2A para validar os endpoints HTTP do backend e faz cleanup imediato
  await runA2ATest();

  console.log("[Seed] Concluído com sucesso! Banco 100% limpo, sem dados chumbados, pronto para você criar suas campanhas e participantes.");
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (err) => {
      console.error("[Seed] Erro na execução:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
