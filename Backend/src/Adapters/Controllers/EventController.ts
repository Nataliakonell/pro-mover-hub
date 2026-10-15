import { Request, Response } from "express";
import { GetAllEvents } from "../../UseCases/Events/GetAllEvents";
import { prisma } from "../../Infrastructure/Database/PrismaClient";

export class EventController {
  constructor(private getAllEvents: GetAllEvents) {}

  async list(req: Request, res: Response) {
    try {
      const events = await this.getAllEvents.execute();

      // Para cada evento, agregamos métricas 100% dinâmicas a partir do banco de dados PostgreSQL
      const enrichedEvents = await Promise.all(
        events.map(async (ev) => {
          const participantCount = await prisma.participant.count({
            where: { eventId: ev.id },
          });

          const triages = await prisma.triage.findMany({
            where: { eventId: ev.id },
            orderBy: { createdAt: "desc" },
          });

          const alteredCount = triages.filter((t) => t.status === "Alterado" || t.status === "Atenção").length;

          // Faixas etárias dos participantes cadastrados no evento
          const eventParticipants = await prisma.participant.findMany({
            where: { eventId: ev.id },
          });

          const ageGroupsMap: Record<string, number> = {
            "18–30": 0,
            "31–45": 0,
            "46–60": 0,
            "60+": 0,
          };

          eventParticipants.forEach((p) => {
            if (ageGroupsMap[p.ageGroup] !== undefined) {
              ageGroupsMap[p.ageGroup]++;
            } else {
              ageGroupsMap["18–30"]++;
            }
          });

          const ageGroups = [
            { age: "18–30", count: ageGroupsMap["18–30"] },
            { age: "31–45", count: ageGroupsMap["31–45"] },
            { age: "46–60", count: ageGroupsMap["46–60"] },
            { age: "60+", count: ageGroupsMap["60+"] },
          ];

          // Alterações reais detectadas nos sinais vitais
          const paAlterada = triages.filter((t) => (t.systolic && t.systolic >= 140) || (t.diastolic && t.diastolic >= 90)).length;
          const glicemiaAlterada = triages.filter((t) => t.glucose && t.glucose >= 140).length;
          const spo2Alterada = triages.filter((t) => t.spo2 && t.spo2 < 95).length;
          const fcAlterada = triages.filter((t) => t.heartRate && (t.heartRate < 50 || t.heartRate > 100)).length;

          // Cortesias e utilizações registradas
          const courtesyRecords = await prisma.courtesyRecord.findMany({
            where: { participant: { eventId: ev.id } },
            include: { utilizations: true },
          });
          const totalCourtesySessions = courtesyRecords.reduce((acc, c) => acc + c.sessions, 0);
          const totalUtilizations = courtesyRecords.reduce((acc, c) => acc + c.utilizations.length, 0);

          return {
            id: ev.id,
            name: ev.name,
            date: ev.date,
            location: ev.location,
            metrics: {
              attended: participantCount,
              triagesDone: triages.length,
              alteredTriages: alteredCount,
              referrals: alteredCount,
              courtesyGranted: totalCourtesySessions,
              scheduledToday: totalUtilizations,
            },
            charts: {
              ageGroups,
              examResults: [
                {
                  name: "Dentro dos parâmetros",
                  percentage: triages.length > 0 ? Math.round(((triages.length - alteredCount) / triages.length) * 100) : 100,
                  color: "var(--color-primary)",
                },
                {
                  name: "Com alterações",
                  percentage: triages.length > 0 ? Math.round((alteredCount / triages.length) * 100) : 0,
                  color: "var(--color-warning)",
                },
              ],
              servicesDist: [
                { name: "Triagem Sinais", count: triages.length },
                { name: "Avaliação Funcional", count: totalCourtesySessions },
                { name: "Orientações Posturais", count: participantCount },
              ],
              examAlterations: [
                { exam: "Pressão Arterial", count: paAlterada },
                { exam: "Glicemia", count: glicemiaAlterada },
                { exam: "SpO₂ Baixa", count: spo2Alterada },
                { exam: "Frequência Cardíaca", count: fcAlterada },
              ],
              eventEvolution: [
                { event: ev.name.split(":")[0] || "Ação", atendimentos: participantCount },
              ],
              referrals: [
                { destination: "Studio Adriane Câmara", count: totalCourtesySessions > 0 ? courtesyRecords.length : 0, color: "#1b806a" },
                { destination: "Clínico Geral / UBS", count: alteredCount, color: "#0ea5e9" },
              ],
            },
            recentTriages: triages.slice(0, 5).map((t) => ({
              id: t.id,
              participant: t.participantName,
              time: t.time,
              responsible: t.responsible,
              status: t.status,
              result: t.result,
            })),
          };
        })
      );

      return res.json(enrichedEvents);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
