import { Request, Response } from "express";
import { GetAllParticipants } from "../../UseCases/Participants/GetAllParticipants";
import { CreateParticipant } from "../../UseCases/Participants/CreateParticipant";
import { AddAttendance } from "../../UseCases/Participants/AddAttendance";

export class ParticipantController {
  constructor(
    private getAllParticipantsUseCase: GetAllParticipants,
    private createParticipantUseCase: CreateParticipant,
    private addAttendanceUseCase: AddAttendance
  ) {}

  async list(req: Request, res: Response) {
    try {
      const participants = await this.getAllParticipantsUseCase.execute();
      return res.json(participants);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, birthDate, age, ageGroup, cpf, phone, eventId } = req.body;
      if (!name || !birthDate) {
        return res.status(400).json({ error: "Nome e Data de Nascimento são obrigatórios." });
      }

      const created = await this.createParticipantUseCase.execute({
        name,
        birthDate,
        age: Number(age) || 0,
        ageGroup: ageGroup || "18–30",
        cpf: cpf || "",
        phone: phone || "",
        eventId: eventId || null,
      });

      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async addAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { date, eventName, type, responsible, status, summary, medicalRecordId } = req.body;

      const record = await this.addAttendanceUseCase.execute({
        participantId: id,
        date: date || new Date().toLocaleDateString("pt-BR"),
        eventName: eventName || "Ação de Saúde",
        type: type || "Triagem de Sinais Vitais",
        responsible: responsible || "Equipe Conecta Saúde",
        status: status || "Normal",
        summary: summary || "",
        medicalRecordId,
      });

      return res.status(201).json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
