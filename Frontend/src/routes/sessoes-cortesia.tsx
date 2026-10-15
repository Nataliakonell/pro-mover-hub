import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Calendar, CheckCircle2, Clock, User, Plus, Info, CalendarPlus, History, Check } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCourtesy, ParticipantCourtesy } from "@/lib/courtesy";

export const Route = createFileRoute("/sessoes-cortesia")({
  head: () => ({
    meta: [
      { title: "Sessões Cortesia | PRO-MOVER" },
      { name: "description", content: "Controle de saldo, concessões e utilizações de sessões cortesia." },
    ],
  }),
  component: SessoesCortesiaPage,
});

function SessoesCortesiaPage() {
  const { participants, calculateBalance, scheduleSession } = useCourtesy();

  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantCourtesy | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "14:30",
    type: "Avaliação Fisioterapêutica Cortesia",
    professional: "Dra. Adriane Câmara (Fisioterapeuta)",
    markAsCompleted: true,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenHistory = (participant: ParticipantCourtesy) => {
    setSelectedParticipant(participant);
  };

  const handleOpenScheduleFromHistory = () => {
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;

    const balance = calculateBalance(selectedParticipant);
    if (balance.remaining <= 0) {
      alert("Este participante já esgotou seu saldo de sessões cortesia.");
      return;
    }

    scheduleSession(selectedParticipant.id, {
      date: `${scheduleForm.date} às ${scheduleForm.time}`,
      type: scheduleForm.type,
      professional: scheduleForm.professional,
      status: scheduleForm.markAsCompleted ? "Realizado" : "Agendado",
    });

    setScheduleModalOpen(false);
    setToastMessage(
      scheduleForm.markAsCompleted
        ? `Atendimento registrado como Realizado! 1 sessão deduzida do saldo de ${selectedParticipant.name}.`
        : `Sessão agendada com sucesso para ${selectedParticipant.name}.`
    );
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  // Atualiza o participante selecionado se houver alteração
  const activeSelected = selectedParticipant
    ? participants.find((p) => p.id === selectedParticipant.id) || selectedParticipant
    : null;

  const activeBalance = activeSelected ? calculateBalance(activeSelected) : null;

  return (
    <AppLayout
      title="Sessões Cortesia"
      subtitle="Painel de controle do benefício comunitário: acompanhe concessões, utilizações e saldo disponível"
    >
      <div className="space-y-6 max-w-5xl">
        {/* 1. Cartão informativo no topo (Destaque Verde) */}
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-foreground">
          <div className="flex items-start gap-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground mt-0.5">
              <Gift className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-primary-foreground md:text-base flex items-center gap-2">
                Regra do Benefício Social
              </h3>
              <p className="text-xs leading-relaxed text-foreground">
                Cada participante pode receber <strong>até 4 sessões por triagem</strong> concluída. O saldo de sessões restantes é <strong>atualizado automaticamente</strong> assim que o atendimento for registrado como <strong>"Realizado"</strong> na agenda do estúdio parceiro.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Tabela Principal */}
        <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Participantes com Sessões Cortesia
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Exibindo apenas participantes com triagens concluídas com concessão de sessões.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {participants.length} participante(s)
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Gift className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              Nenhuma sessão cortesia concedida.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                    <th className="py-3 px-5 font-medium">Paciente</th>
                    <th className="py-3 px-4 font-medium text-center">Concedidas</th>
                    <th className="py-3 px-4 font-medium text-center">Utilizadas</th>
                    <th className="py-3 px-4 font-medium text-center">Restantes</th>
                    <th className="py-3 px-4 font-medium text-center">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Histórico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants.map((participant) => {
                    const balance = calculateBalance(participant);
                    return (
                      <tr key={participant.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-primary font-medium text-xs">
                              {participant.name.charAt(0)}
                            </span>
                            <div>
                              <p className="font-medium text-foreground text-sm">{participant.name}</p>
                              <p className="text-[11px] text-muted-foreground">{participant.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-medium text-sm">
                          {balance.granted}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-muted-foreground text-sm">
                          {balance.used}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className={`font-mono text-sm font-bold ${balance.remaining > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {balance.remaining}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                              balance.status === "Ativo"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {balance.status}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenHistory(participant)}
                            className="gap-1.5 text-xs h-8"
                          >
                            <History className="size-3.5" />
                            Ver histórico
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Modal de Histórico */}
      {activeSelected && (
        <Dialog open={selectedParticipant !== null} onOpenChange={(open) => !open && setSelectedParticipant(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="font-display text-xl font-normal">
                  Histórico de Sessões Cortesia
                </DialogTitle>
                {activeBalance && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeBalance.remaining > 0
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    Saldo: {activeBalance.remaining} sessão(ões) restante(s)
                  </span>
                )}
              </div>
              <DialogDescription>
                Participante: <strong>{activeSelected.name}</strong> ({activeSelected.id})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Resumo do Saldo */}
              <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Concedidas</p>
                  <p className="font-display text-lg font-bold text-foreground">{activeBalance?.granted}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Utilizadas</p>
                  <p className="font-display text-lg font-bold text-muted-foreground">{activeBalance?.used}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Saldo Restante</p>
                  <p className="font-display text-lg font-bold text-primary">{activeBalance?.remaining}</p>
                </div>
              </div>

              {/* Lista de Concessões */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Concessões Registradas (Triagens Concluídas)
                </h4>
                <div className="space-y-2">
                  {activeSelected.concessions.map((c) => (
                    <div key={c.id} className="rounded-md border border-border bg-card p-3 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span>Data da Triagem: {c.date}</span>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary font-semibold text-[11px]">
                          +{c.sessions} sessão(ões) concedida(s)
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                        Motivo clínico: {c.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Utilizações */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Utilizações (Atendimentos Realizados)
                </h4>
                {activeSelected.utilizations.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md text-center">
                    Nenhuma sessão utilizada ainda. O participante dispõe do saldo integral.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeSelected.utilizations.map((u) => (
                      <div key={u.id} className="rounded-md border border-border bg-card p-3 text-xs flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{u.type}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {u.date} · {u.professional}
                          </p>
                        </div>
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground shrink-0">
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setSelectedParticipant(null)}>
                Fechar
              </Button>
              <Button
                disabled={activeBalance?.remaining === 0}
                onClick={handleOpenScheduleFromHistory}
                className="gap-2"
              >
                <CalendarPlus className="size-4" />
                Agendar sessão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Agendamento da Sessão Cortesia */}
      {activeSelected && (
        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-normal">
                Agendar Atendimento Cortesia
              </DialogTitle>
              <DialogDescription>
                Agendamento pré-selecionado para <strong>{activeSelected.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmSchedule} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sched-date" className="text-xs">Data do atendimento</Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-time" className="text-xs">Horário</Label>
                <Input
                  id="sched-time"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-type" className="text-xs">Tipo de sessão</Label>
                <Input
                  id="sched-type"
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-prof" className="text-xs">Profissional responsável</Label>
                <Input
                  id="sched-prof"
                  value={scheduleForm.professional}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, professional: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-3 text-xs">
                <input
                  id="sched-complete"
                  type="checkbox"
                  checked={scheduleForm.markAsCompleted}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, markAsCompleted: e.target.checked })}
                  className="rounded text-primary focus:ring-primary size-4"
                />
                <Label htmlFor="sched-complete" className="text-xs cursor-pointer font-normal">
                  Marcar como <strong>"Realizado"</strong> imediatamente (abate 1 sessão do saldo agora).
                </Label>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Confirmar Agendamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast de Confirmação */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg"
        >
          <Check className="size-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
