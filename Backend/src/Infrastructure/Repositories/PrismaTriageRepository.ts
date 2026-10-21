import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";
import { TriageEntity } from "../../Domain/Entities/Triage";
import { prisma } from "../Database/PrismaClient";

export class PrismaTriageRepository implements ITriageRepository {
  async findAll(eventId?: string): Promise<TriageEntity[]> {
    const list = await prisma.triage.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async create(data: Omit<TriageEntity, "id" | "createdAt">): Promise<TriageEntity> {
    const newId = `TR-${Date.now().toString().slice(-4)}`;
    const created = await prisma.triage.create({
      data: {
        id: newId,
        participantId: data.participantId || null,
        participantName: data.participantName,
        eventId: data.eventId,
        time: data.time || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        responsible: data.responsible,
        status: data.status,
        systolic: data.systolic,
        diastolic: data.diastolic,
        spo2: data.spo2,
        heartRate: data.heartRate,
        result: data.result,
      },
    });
    return created as any;
  }
}
