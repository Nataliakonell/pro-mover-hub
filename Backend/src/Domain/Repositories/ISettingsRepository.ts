import { SettingsEntity } from "../Entities/Settings";

export interface ISettingsRepository {
  get(): Promise<SettingsEntity>;
  update(data: Partial<SettingsEntity>): Promise<SettingsEntity>;
}
