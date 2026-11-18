import { ITriageRepository } from "../../Domain/Repositories/ITriageRepository";
import { TriageEntity } from "../../Domain/Entities/Triage";
import { prisma } from "../Database/PrismaClient";

export class PrismaTriageRepository implements ITriageRepository {
  async findAll(eventId?: string, participantId?: string): Promise<TriageEntity[]> {
    const where: any = {};
    if (eventId) {
      where.eventId = eventId;
    }
    if (participantId) {
      where.participantId = participantId;
    }

    const list = await prisma.triage.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            startDate: true,
            endDate: true,
            pharmacy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return list.map((item) => ({
      ...item,
      eventName: item.event?.name,
      pharmacyName: item.event?.pharmacy?.name,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : undefined,
    })) as any;
  }

  async findById(id: string): Promise<TriageEntity | null> {
    const item = await prisma.triage.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            startDate: true,
            endDate: true,
            pharmacy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!item) return null;
    return {
      ...item,
      eventName: item.event?.name,
      pharmacyName: item.event?.pharmacy?.name,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : undefined,
    } as any;
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

  async update(id: string, data: Partial<Omit<TriageEntity, "id" | "createdAt">>): Promise<TriageEntity> {
    const updateData: any = {};
    if (data.participantId !== undefined) updateData.participantId = data.participantId;
    if (data.participantName !== undefined) updateData.participantName = data.participantName;
    if (data.eventId !== undefined) updateData.eventId = data.eventId;
    if (data.time !== undefined) updateData.time = data.time;
    if (data.responsible !== undefined) updateData.responsible = data.responsible;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.systolic !== undefined) updateData.systolic = Number(data.systolic);
    if (data.diastolic !== undefined) updateData.diastolic = Number(data.diastolic);
    if (data.spo2 !== undefined) updateData.spo2 = Number(data.spo2);
    if (data.heartRate !== undefined) updateData.heartRate = Number(data.heartRate);
    if (data.result !== undefined) updateData.result = data.result;

    const updated = await prisma.triage.update({
      where: { id },
      data: updateData,
    });
    return updated as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.triage.delete({ where: { id } });
  }
}
