import { Request, Response } from "express";
import { GetCourtesyRecords } from "../../UseCases/Courtesy/GetCourtesyRecords";
import { ScheduleSession } from "../../UseCases/Courtesy/ScheduleSession";
import { ICourtesyRepository } from "../../Domain/Repositories/ICourtesyRepository";

export class CourtesyController {
  constructor(
    private getCourtesyRecords: GetCourtesyRecords,
    private scheduleSession: ScheduleSession,
    private courtesyRepo: ICourtesyRepository
  ) {}

  async list(req: Request, res: Response) {
    try {
      const records = await this.getCourtesyRecords.execute();
      return res.json(records);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async concede(req: Request, res: Response) {
    try {
      const { participantId, triageId, sessions, reason } = req.body;
      if (!participantId || !reason) {
        return res.status(400).json({ error: "Participante e justificativa são obrigatórios." });
      }

      // Regra: até 4 sessões por triagem
      const totalSessions = Math.min(Math.max(Number(sessions) || 1, 1), 4);

      const concession = await this.courtesyRepo.createConcession({
        participantId,
        triageId,
        sessions: totalSessions,
        reason,
      });

      return res.status(201).json(concession);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async schedule(req: Request, res: Response) {
    try {
      const { courtesyRecordId, date, type, professional, status } = req.body;
      if (!courtesyRecordId || !date) {
        return res.status(400).json({ error: "Registro de cortesia e data são obrigatórios." });
      }

      const scheduled = await this.scheduleSession.execute({
        courtesyRecordId,
        date,
        type: type || "Avaliação Funcional Cortesia",
        professional: professional || "Profissional Responsável",
        status: status || "Agendado",
      });

      return res.status(201).json(scheduled);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
