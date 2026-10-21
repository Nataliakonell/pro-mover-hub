import { IParticipantRepository } from "../../Domain/Repositories/IParticipantRepository";
import { ParticipantEntity } from "../../Domain/Entities/Participant";
import { prisma } from "../Database/PrismaClient";

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
}
