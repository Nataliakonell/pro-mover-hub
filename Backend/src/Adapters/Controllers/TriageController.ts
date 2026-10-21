import { Request, Response } from "express";
import { GetAllTriages } from "../../UseCases/Triages/GetAllTriages";
import { CreateTriage } from "../../UseCases/Triages/CreateTriage";

export class TriageController {
  constructor(
    private getAllTriages: GetAllTriages,
    private createTriage: CreateTriage
  ) {}

  async list(req: Request, res: Response) {
    try {
      const eventId = req.query.eventId as string | undefined;
      const triages = await this.getAllTriages.execute(eventId);
      return res.json(triages);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        participantId,
        participantName,
        eventId,
        time,
        responsible,
        status,
        systolic,
        diastolic,
        spo2,
        heartRate,
        result,
      } = req.body;

      if (!participantName || !eventId) {
        return res.status(400).json({ error: "Nome do participante e Evento são obrigatórios." });
      }

      const created = await this.createTriage.execute({
        participantId: participantId || null,
        participantName,
        eventId,
        time: time || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        responsible: responsible || "Profissional Clínico",
        status: status || "Normal",
        systolic: Number(systolic) || 120,
        diastolic: Number(diastolic) || 80,
        spo2: Number(spo2) || 98,
        heartRate: Number(heartRate) || 72,
        result: result || `PA ${systolic}/${diastolic}`,
      });

      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
