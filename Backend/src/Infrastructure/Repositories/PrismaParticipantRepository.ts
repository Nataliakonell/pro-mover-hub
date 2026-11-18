import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";
import { ParticipantEntity } from "../../Domain/Entities/Participant";
import { prisma } from "../Database/PrismaClient";
import bcrypt from "bcryptjs";

export class PrismaParticipantRepository implements IParticipantRepository {
  async findAll(): Promise<ParticipantEntity[]> {
    const list = await prisma.participant.findMany({
      include: {
        attendances: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async findById(id: string): Promise<ParticipantEntity | null> {
    const p = await prisma.participant.findUnique({
      where: { id },
      include: {
        attendances: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return p as any;
  }

  async create(data: Omit<ParticipantEntity, "id" | "createdAt" | "attendances">): Promise<ParticipantEntity> {
    const newId = `PART-${Date.now().toString().slice(-4)}`;

    let validEventId = null;
    if (data.eventId) {
      const eventExists = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (eventExists) {
        validEventId = data.eventId;
      }
    }

    const created = await prisma.participant.create({
      data: {
        id: newId,
        name: data.name,
        birthDate: data.birthDate,
        age: data.age,
        ageGroup: data.ageGroup,
        cpf: data.cpf,
        phone: data.phone,
        eventId: validEventId,
        attendances: {
          create: {
            id: `ATT-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString("pt-BR"),
            eventName: "Ação de Saúde Comunitária",
            type: "Cadastro e Acolhimento Comunitário",
            responsible: "Equipe Conecta Saúde",
            status: "Concluído",
            summary: "Cadastro inicial registrado no banco de dados com dados biométricos e contato.",
            medicalRecordId: `PR-${newId}`,
          },
        },
      },
      include: {
        attendances: true,
      },
    });

    // Criação ou sincronização automática da conta de usuário para o participante (role: "client")
    // O login será o CPF (apenas números) e a senha padrão é o próprio CPF
    const cpfDigits = (data.cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11) {
      try {
        const clientEmail = `cliente_${cpfDigits}@conectasaude.local`;
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: cpfDigits },
              { email: clientEmail },
            ],
          },
        });

        if (!existingUser) {
          const passwordHash = await bcrypt.hash(cpfDigits, 10);
          await prisma.user.create({
            data: {
              name: data.name,
              email: clientEmail,
              username: cpfDigits,
              passwordHash,
              role: "client",
              mustChangePassword: false,
            },
          });
        }
      } catch (err: any) {
        console.warn("[Participant] Aviso ao registrar conta client do participante:", err.message);
      }
    }

    return created as any;
  }

  async addAttendance(data: {
    participantId: string;
    date: string;
    eventName: string;
    type: string;
    responsible: string;
    status: string;
    summary: string;
    medicalRecordId?: string;
  }): Promise<any> {
    const newAttId = `ATT-${Date.now().toString().slice(-4)}`;
    return await prisma.attendance.create({
      data: {
        id: newAttId,
        participantId: data.participantId,
        date: data.date,
        eventName: data.eventName,
        type: data.type,
        responsible: data.responsible,
        status: data.status,
        summary: data.summary,
        medicalRecordId: data.medicalRecordId || null,
      },
    });
  }

  async update(id: string, data: Partial<Omit<ParticipantEntity, "id" | "createdAt" | "attendances">>): Promise<ParticipantEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.ageGroup !== undefined) updateData.ageGroup = data.ageGroup;
    if (data.cpf !== undefined) updateData.cpf = data.cpf;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.eventId !== undefined) updateData.eventId = data.eventId;

    const updated = await prisma.participant.update({
      where: { id },
      data: updateData,
      include: {
        attendances: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return updated as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.triage.deleteMany({ where: { participantId: id } });
    await prisma.attendance.deleteMany({ where: { participantId: id } });
    await prisma.participant.delete({ where: { id } });
  }
}
