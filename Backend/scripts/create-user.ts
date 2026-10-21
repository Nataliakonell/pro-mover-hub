import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";
import crypto from "crypto";

const prisma = new PrismaClient();

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function generateUsername(fullName: string): string {
  if (!fullName) return "user";
  const parts = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "user";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

function generateRandomPassword(length: number = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const allChars = upper + lower + digits + special;

  const initial = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  for (let i = 4; i < length; i++) {
    initial.push(allChars[crypto.randomInt(allChars.length)]);
  }

  for (let i = initial.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [initial[i], initial[j]] = [initial[j], initial[i]];
  }

  return initial.join("");
}

async function main() {
  console.log("\n=================================================================");
  console.log("   PRO-MOVER Hub · Criação de Usuário Multi-Tenant (CLI)         ");
  console.log("   (100% Persistido no PostgreSQL · Senha Randômica Temporária)   ");
  console.log("=================================================================\n");

  const rl = createInterface();

  try {
    // 1. Nome completo
    let name = "";
    while (!name) {
      name = await ask(rl, "Nome Completo do Usuário: ");
      if (!name) console.log(">> O nome é obrigatório!");
    }

    // 2. E-mail com checagem de unicidade no PostgreSQL
    let email = "";
    while (!email) {
      email = await ask(rl, "E-mail: ");
      if (!email) {
        console.log(">> O e-mail é obrigatório!");
        continue;
      }
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existing) {
        console.log(`>> Já existe um usuário cadastrado com o e-mail '${email}' no banco.`);
        email = "";
      }
    }

    // 3. Username
    const defaultUsername = generateUsername(name);
    const typedUsername = await ask(
      rl,
      `Nome de Usuário (Username) [padrão: ${defaultUsername}]: `
    );
    let username = typedUsername || defaultUsername;

    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      username = `${username}_${Date.now().toString().slice(-4)}`;
      console.log(`>> Username já estava em uso, ajustado para: ${username}`);
    }

    // 4. Seleção de Perfil (Role)
    console.log("\nSelecione o perfil do usuário:");
    console.log(" [1] Administrador Geral (admin) - Acesso irrestrito a todo o sistema e todos os grupos/farmácias");
    console.log(" [2] Gestor do Grupo de Farmácias (group_manager) - Escopo é o Grupo (gerencia farmácias e usuários do grupo)");
    console.log(" [3] Usuário da Farmácia (pharmacy_user) - Escopo é a farmácia específica");
    console.log(" [4] Cliente / Participante (client) - Histórico clínico pessoal");

    let roleOption = "";
    while (!["1", "2", "3", "4"].includes(roleOption)) {
      roleOption = await ask(rl, "Opção (1, 2, 3 ou 4): ");
    }

    let role = "admin";
    if (roleOption === "2") role = "group_manager";
    if (roleOption === "3") role = "pharmacy_user";
    if (roleOption === "4") role = "client";

    let groupId: string | null = null;
    let pharmacyId: string | null = null;

    // 5. Se for Gestor de Grupo (group_manager): vincular ao Grupo de Farmácias
    if (role === "group_manager") {
      const groups = await prisma.pharmacyGroup.findMany({
        orderBy: { name: "asc" },
      });

      if (groups.length === 0) {
        console.log("\n[Aviso] Nenhum Grupo de Farmácias cadastrado no PostgreSQL.");
        const createNow = await ask(rl, "Deseja cadastrar um novo Grupo de Farmácias agora? (s/n): ");
        if (createNow.toLowerCase() === "s") {
          const groupName = await ask(rl, "Nome do Grupo de Farmácias (ex: Rede Farma Vida): ");
          const groupCnpj = await ask(rl, "CNPJ do Grupo (opcional): ");
          const groupResp = await ask(rl, "Responsável do Grupo (opcional): ");
          const count = await prisma.pharmacyGroup.count();
          const newGrpId = `GRP-${String(count + 1).padStart(3, "0")}`;

          const createdGroup = await prisma.pharmacyGroup.create({
            data: {
              id: newGrpId,
              name: groupName || "Grupo Principal",
              cnpj: groupCnpj || null,
              responsible: groupResp || name,
            },
          });
          groupId = createdGroup.id;
          console.log(`✔ Grupo '${createdGroup.name}' cadastrado no PostgreSQL com ID: ${createdGroup.id}`);
        } else {
          console.log(">> Gestor criado sem vínculo de grupo inicial.");
        }
      } else {
        console.log("\nSelecione o Grupo de Farmácias:");
        groups.forEach((g, idx) => {
          console.log(` [${idx + 1}] ${g.name} (ID: ${g.id}${g.cnpj ? ` - CNPJ: ${g.cnpj}` : ""})`);
        });

        let gOption = -1;
        while (gOption < 1 || gOption > groups.length) {
          const raw = await ask(rl, `Escolha o Grupo (1 a ${groups.length}): `);
          gOption = parseInt(raw, 10);
        }
        groupId = groups[gOption - 1].id;
        console.log(`✔ Vinculado ao Grupo: ${groups[gOption - 1].name}`);
      }
    }

    // 6. Se for Usuário da Farmácia (pharmacy_user): vincular à Farmácia
    if (role === "pharmacy_user") {
      const pharmacies = await prisma.pharmacy.findMany({
        orderBy: { name: "asc" },
        include: { group: true },
      });

      if (pharmacies.length === 0) {
        console.log("\n[Aviso] Nenhuma farmácia cadastrada no PostgreSQL.");
        console.log(">> Cadastre uma farmácia antes de criar o usuário de farmácia.");
        rl.close();
        await prisma.$disconnect();
        return;
      }

      console.log("\nSelecione a farmácia em que o usuário trabalhará:");
      pharmacies.forEach((p, idx) => {
        const groupLabel = p.group ? ` [Grupo: ${p.group.name}]` : " [Sem Grupo]";
        console.log(` [${idx + 1}] ${p.name}${groupLabel} (CNPJ: ${p.cnpj} - ID: ${p.id})`);
      });

      let pOption = -1;
      while (pOption < 1 || pOption > pharmacies.length) {
        const raw = await ask(rl, `Escolha a farmácia (1 a ${pharmacies.length}): `);
        pOption = parseInt(raw, 10);
      }

      const selected = pharmacies[pOption - 1];
      pharmacyId = selected.id;
      groupId = selected.groupId || null;
      console.log(`✔ Vinculado à Farmácia: ${selected.name}${selected.group ? ` (Grupo: ${selected.group.name})` : ""}`);
    }

    // 7. Geração da SENHA RANDÔMICA com alteração obrigatória no primeiro login
    const randomPassword = generateRandomPassword(10);
    console.log(`\nGerando senha temporária randômica segura...`);

    const customPassPrompt = await ask(
      rl,
      `Deseja usar a senha randômica gerada automaticamente [${randomPassword}]? (Enter para aceitar ou digite uma personalizada): `
    );
    const finalPassword = customPassPrompt.trim() || randomPassword;

    rl.close();

    // 8. Hash com bcrypt e inserção no PostgreSQL
    console.log("Criptografando com bcrypt e gravando no PostgreSQL...");
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        role,
        groupId,
        pharmacyId,
        mustChangePassword: true,
      },
      include: {
        group: true,
        pharmacy: true,
      },
    });

    console.log("\n=================================================================");
    console.log("✔ SUCESSO: Usuário criado e persistido no PostgreSQL!");
    console.log("=================================================================");
    console.log(` ID:                 ${createdUser.id}`);
    console.log(` Nome:               ${createdUser.name}`);
    console.log(` E-mail:             ${createdUser.email}`);
    console.log(` Username:           ${createdUser.username}`);
    console.log(` Perfil (Role):      ${createdUser.role}`);
    console.log(` Grupo de Farmácias: ${createdUser.group ? createdUser.group.name : "Nenhum / Global"}`);
    console.log(` Farmácia Vinculada: ${createdUser.pharmacy ? createdUser.pharmacy.name : "Nenhuma / Global"}`);
    console.log(` Troca no 1º Login:  ${createdUser.mustChangePassword ? "OBRIGATÓRIA (SIM)" : "Não"}`);
    console.log("-----------------------------------------------------------------");
    console.log(` SENHA TEMPORÁRIA:   ${finalPassword}`);
    console.log(" (Forneça esta senha ao usuário; ele deverá alterá-la no 1º login)");
    console.log("=================================================================\n");
  } catch (error: any) {
    console.error("\n❌ Erro ao criar usuário no banco:", error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
