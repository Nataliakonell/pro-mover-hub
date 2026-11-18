import { Request, Response } from "express";
import { GetAllTriages } from "../../UseCases/Triages/GetAllTriages";
import { CreateTriage } from "../../UseCases/Triages/CreateTriage";
import { UpdateTriage } from "../../UseCases/Triages/UpdateTriage";
import { DeleteTriage } from "../../UseCases/Triages/DeleteTriage";
import { AuthenticatedRequest } from "../Middlewares/AuthMiddleware";
import { prisma } from "../../Infrastructure/Database/PrismaClient";

export class TriageController {
  constructor(
    private getAllTriages: GetAllTriages,
    private createTriage: CreateTriage,
    private updateTriageUseCase?: UpdateTriage,
    private deleteTriageUseCase?: DeleteTriage
  ) {}

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.query.eventId as string | undefined;
      let participantId = req.query.participantId as string | undefined;

      // Se for usuário com role 'client', só pode ver as triagens dele mesmo
      if (req.user?.role === "client") {
        const cpfDigits = (req.user.username || "").replace(/\D/g, "");
        if (cpfDigits) {
          const formattedCpf =
            cpfDigits.length === 11
              ? `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`
              : "";

          // Busca o participante correspondente ao CPF (formatado ou limpo)
          const matchingParticipant = await prisma.participant.findFirst({
            where: {
              OR: [
                { cpf: cpfDigits },
                ...(formattedCpf ? [{ cpf: formattedCpf }] : []),
              ],
            },
          });

          if (matchingParticipant) {
            participantId = matchingParticipant.id;
          } else {
            // Se ainda não encontrou participante com esse CPF, retorna lista vazia
            return res.json([]);
          }
        }
      }

      const triages = await this.getAllTriages.execute(eventId, participantId);
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

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
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

      if (!this.updateTriageUseCase) {
        return res.status(500).json({ error: "Caso de uso UpdateTriage não inicializado." });
      }

      const updated = await this.updateTriageUseCase.execute(id, {
        participantId,
        participantName,
        eventId,
        time,
        responsible,
        status,
        systolic: systolic !== undefined ? Number(systolic) : undefined,
        diastolic: diastolic !== undefined ? Number(diastolic) : undefined,
        spo2: spo2 !== undefined ? Number(spo2) : undefined,
        heartRate: heartRate !== undefined ? Number(heartRate) : undefined,
        result,
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!this.deleteTriageUseCase) {
        return res.status(500).json({ error: "Caso de uso DeleteTriage não inicializado." });
      }

      await this.deleteTriageUseCase.execute(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
