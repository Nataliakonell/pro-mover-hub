export interface SettingsEntity {
  id: number;
  eventDate: string;
  eventLocation: string;
  sysMinThreshold: number;
  sysMaxThreshold: number;
  diaMinThreshold: number;
  diaMaxThreshold: number;
  sysThreshold?: number;
  diaThreshold?: number;
  spo2Threshold: number;
  hrMinThreshold: number;
  hrMaxThreshold: number;
  updatedAt?: Date;
}
