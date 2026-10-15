import { ICourtesyRepository } from "../../Domain/Repositories/ICourtesyRepository";
import { CourtesyRecordEntity, CourtesyUtilizationEntity } from "../../Domain/Entities/Courtesy";
import { prisma } from "../Database/PrismaClient";

export class PrismaCourtesyRepository implements ICourtesyRepository {
  async findAll(): Promise<any[]> {
    const list = await prisma.participant.findMany({
      where: {
        courtesyRecords: {
          some: {},
        },
      },
      include: {
        courtesyRecords: {
          include: {
            utilizations: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Mapear para o formato que a tela espera: { id, name, concessions: [...], utilizations: [...] }
    return list.map((p) => {
      const concessions = p.courtesyRecords.map((c) => ({
        id: c.id,
        triageId: c.triageId || "TR-00",
        date: c.date,
        sessions: c.sessions,
        reason: c.reason,
      }));

      const utilizations = p.courtesyRecords.flatMap((c) =>
        c.utilizations.map((u) => ({
          id: u.id,
          courtesyRecordId: c.id,
          date: u.date,
          type: u.type,
          professional: u.professional,
          status: u.status,
        }))
      );

      return {
        id: p.id,
        name: p.name,
        concessions,
        utilizations,
      };
    });
  }

  async createConcession(data: {
    participantId: string;
    triageId?: string;
    sessions: number;
    reason: string;
  }): Promise<CourtesyRecordEntity> {
    const newId = `C-${Date.now().toString().slice(-4)}`;
    const created = await prisma.courtesyRecord.create({
      data: {
        id: newId,
        participantId: data.participantId,
        triageId: data.triageId || null,
        date: new Date().toLocaleDateString("pt-BR"),
        sessions: data.sessions,
        reason: data.reason,
      },
    });
    return created as any;
  }

  async createUtilization(data: {
    courtesyRecordId: string;
    date: string;
    type: string;
    professional: string;
    status: "Realizado" | "Agendado" | "Cancelado";
  }): Promise<CourtesyUtilizationEntity> {
    const newId = `U-${Date.now().toString().slice(-4)}`;
    const created = await prisma.courtesyUtilization.create({
      data: {
        id: newId,
        courtesyRecordId: data.courtesyRecordId,
        date: data.date,
        type: data.type,
        professional: data.professional,
        status: data.status,
      },
    });
    return created as any;
  }
}
