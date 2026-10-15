import { ISettingsRepository } from "../../Domain/Repositories/ISettingsRepository";

export class GetSettings {
  constructor(private settingsRepo: ISettingsRepository) {}

  async execute() {
    return await this.settingsRepo.get();
  }
}
