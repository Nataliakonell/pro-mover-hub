import { ISettingsRepository } from "../../Domain/Repositories/ISettingsRepository";
import { SettingsEntity } from "../../Domain/Entities/Settings";

export class UpdateSettings {
  constructor(private settingsRepo: ISettingsRepository) {}

  async execute(input: Partial<SettingsEntity>) {
    return await this.settingsRepo.update(input);
  }
}
