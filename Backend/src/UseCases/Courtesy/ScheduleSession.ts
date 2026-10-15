import { ICourtesyRepository } from "../../Domain/Repositories/ICourtesyRepository";

export class ScheduleSession {
  constructor(private courtesyRepo: ICourtesyRepository) {}

  async execute(input: {
    courtesyRecordId: string;
    date: string;
    type: string;
    professional: string;
    status: "Realizado" | "Agendado" | "Cancelado";
  }) {
    return await this.courtesyRepo.createUtilization(input);
  }
}
