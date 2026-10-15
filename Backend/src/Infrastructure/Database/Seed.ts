import { prisma } from "./PrismaClient";
import bcrypt from "bcryptjs";

export async function runSeed() {
  console.log("[Seed] Iniciando configuração e limpeza do banco de dados...");

  // 1. Limpeza de quaisquer dados mockados/fictícios residuais
  await prisma.courtesyUtilization.deleteMany({});
  await prisma.courtesyRecord.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.triage.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.participant.deleteMany({});
  console.log("[Seed] Tabelas de dados clínicos e participantes limpas com sucesso.");

  // 2. Usuários para autenticação dos 4 perfis
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
  console.log("[Seed] Perfis de usuário configurados.");

  // 3. Configurações Iniciais do Sistema
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
  console.log("[Seed] Configurações de alerta e evento inicial salvas.");

  // 4. Ações de Saúde Comunitárias (Estrutura de Eventos)
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
  console.log("[Seed] Eventos comunitários configurados.");
  console.log("[Seed] Concluído! O banco está pronto e limpo para receber dados reais via Frontend.");
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Erro na execução:", err);
      process.exit(1);
    });
}
