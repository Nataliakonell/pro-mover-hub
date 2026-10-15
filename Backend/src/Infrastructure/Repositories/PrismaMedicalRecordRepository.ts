import { IMedicalRecordRepository } from "../../Domain/Repositories/IMedicalRecordRepository";
import { MedicalRecordEntity } from "../../Domain/Entities/MedicalRecord";
import { prisma } from "../Database/PrismaClient";

export class PrismaMedicalRecordRepository implements IMedicalRecordRepository {
  async findAll(): Promise<MedicalRecordEntity[]> {
    const list = await prisma.medicalRecord.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list as any;
  }

  async findById(id: string): Promise<MedicalRecordEntity | null> {
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
    });
    return record as any;
  }

  async create(data: Omit<MedicalRecordEntity, "createdAt">): Promise<MedicalRecordEntity> {
    const created = await prisma.medicalRecord.create({
      data: {
        id: data.id || `PR-2026-${Date.now().toString().slice(-4)}`,
        participantId: data.participantId || null,
        name: data.name,
        age: data.age,
        date: data.date || new Date().toLocaleDateString("pt-BR"),
        status: data.status,
        pressure: data.pressure,
        glucose: data.glucose,
        spo2: data.spo2 || null,
        heartRate: data.heartRate || null,
        note: data.note,
        tone: data.tone,
      },
    });
    return created as any;
  }
}
