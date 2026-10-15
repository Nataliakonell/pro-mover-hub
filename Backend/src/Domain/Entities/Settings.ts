export interface SettingsEntity {
  id: number;
  eventDate: string;
  eventLocation: string;
  sysThreshold: number;
  diaThreshold: number;
  glucoseThreshold: number;
  spo2Threshold: number;
  hrMinThreshold: number;
  hrMaxThreshold: number;
  updatedAt?: Date;
}
