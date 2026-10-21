const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users in DB:", users);

    const events = await prisma.event.findMany();
    console.log("Events in DB:", events);

    const participants = await prisma.participant.findMany();
    console.log("Participants in DB:", participants);

    const triages = await prisma.triage.findMany();
    console.log("Triages in DB:", triages);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
