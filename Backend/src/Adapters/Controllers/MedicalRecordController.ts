import { Request, Response } from "express";
import { GetAllMedicalRecords } from "../../UseCases/MedicalRecords/GetAllMedicalRecords";
import { CreateMedicalRecord } from "../../UseCases/MedicalRecords/CreateMedicalRecord";

export class MedicalRecordController {
  constructor(
    private getAllMedicalRecords: GetAllMedicalRecords,
    private createMedicalRecord: CreateMedicalRecord
  ) {}

  async list(req: Request, res: Response) {
    try {
      const records = await this.getAllMedicalRecords.execute();
      return res.json(records);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        id,
        participantId,
        name,
        age,
        date,
        status,
        pressure,
        glucose,
        spo2,
        heartRate,
        note,
        tone,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Nome do paciente é obrigatório." });
      }

      const created = await this.createMedicalRecord.execute({
        id,
        participantId: participantId || null,
        name,
        age: Number(age) || 0,
        date: date || new Date().toLocaleDateString("pt-BR"),
        status: status || "Normal",
        pressure: pressure || "120/80 mmHg",
        glucose: glucose || "90 mg/dL",
        spo2: spo2 || "98%",
        heartRate: heartRate || "72 bpm",
        note: note || "Atendimento clínico realizado.",
        tone: tone || "info",
      });

      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
