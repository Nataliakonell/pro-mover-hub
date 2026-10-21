import { Request, Response } from "express";
import { GetSettings } from "../../UseCases/Settings/GetSettings";
import { UpdateSettings } from "../../UseCases/Settings/UpdateSettings";

export class SettingsController {
  constructor(
    private getSettings: GetSettings,
    private updateSettings: UpdateSettings
  ) {}

  async get(req: Request, res: Response) {
    try {
      const settings = await this.getSettings.execute();
      return res.json(settings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const {
        eventDate,
        eventLocation,
        sysMinThreshold,
        sysMaxThreshold,
        diaMinThreshold,
        diaMaxThreshold,
        sysThreshold,
        diaThreshold,
        spo2Threshold,
        hrMinThreshold,
        hrMaxThreshold,
      } = req.body;

      const updated = await this.updateSettings.execute({
        eventDate,
        eventLocation,
        sysMinThreshold: sysMinThreshold !== undefined ? Number(sysMinThreshold) : undefined,
        sysMaxThreshold: sysMaxThreshold !== undefined ? Number(sysMaxThreshold) : (sysThreshold !== undefined ? Number(sysThreshold) : undefined),
        diaMinThreshold: diaMinThreshold !== undefined ? Number(diaMinThreshold) : undefined,
        diaMaxThreshold: diaMaxThreshold !== undefined ? Number(diaMaxThreshold) : (diaThreshold !== undefined ? Number(diaThreshold) : undefined),
        sysThreshold: sysMaxThreshold !== undefined ? Number(sysMaxThreshold) : (sysThreshold !== undefined ? Number(sysThreshold) : undefined),
        diaThreshold: diaMaxThreshold !== undefined ? Number(diaMaxThreshold) : (diaThreshold !== undefined ? Number(diaThreshold) : undefined),
        spo2Threshold: spo2Threshold !== undefined ? Number(spo2Threshold) : undefined,
        hrMinThreshold: hrMinThreshold !== undefined ? Number(hrMinThreshold) : undefined,
        hrMaxThreshold: hrMaxThreshold !== undefined ? Number(hrMaxThreshold) : undefined,
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
