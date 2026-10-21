import { ISettingsRepository } from "../../Domain/Repositories/ISettingsRepository";
import { SettingsEntity } from "../../Domain/Entities/Settings";
import { prisma } from "../Database/PrismaClient";

export class PrismaSettingsRepository implements ISettingsRepository {
  async get(): Promise<SettingsEntity> {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
    });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          eventDate: "15/10/2026",
          eventLocation: "Farmácia Popular Santa Luzia",
          sysMinThreshold: 90,
          sysMaxThreshold: 140,
          diaMinThreshold: 60,
          diaMaxThreshold: 90,
          sysThreshold: 140,
          diaThreshold: 90,
          spo2Threshold: 92,
          hrMinThreshold: 50,
          hrMaxThreshold: 100,
        },
      });
    }
    return settings as any;
  }

  async update(data: Partial<SettingsEntity>): Promise<SettingsEntity> {
    const updated = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        eventDate: data.eventDate || "15/10/2026",
        eventLocation: data.eventLocation || "Farmácia Popular Santa Luzia",
        sysMinThreshold: data.sysMinThreshold ?? 90,
        sysMaxThreshold: data.sysMaxThreshold ?? 140,
        diaMinThreshold: data.diaMinThreshold ?? 60,
        diaMaxThreshold: data.diaMaxThreshold ?? 90,
        sysThreshold: data.sysMaxThreshold ?? data.sysThreshold ?? 140,
        diaThreshold: data.diaMaxThreshold ?? data.diaThreshold ?? 90,
        spo2Threshold: data.spo2Threshold ?? 92,
        hrMinThreshold: data.hrMinThreshold ?? 50,
        hrMaxThreshold: data.hrMaxThreshold ?? 100,
      },
    });
    return updated as any;
  }
}
