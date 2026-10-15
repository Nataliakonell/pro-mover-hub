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
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 sm:p-6 text-foreground shadow-2xs">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground mt-0.5 shadow-xs">
              <Gift className="size-6" />
            </span>
            <div className="space-y-1.5">
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Regra do Benefício Social
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">
                Cada participante pode receber <strong>até 4 sessões por triagem</strong> concluída. O saldo de sessões restantes é <strong>atualizado automaticamente</strong> assim que o atendimento for registrado como <strong>"Realizado"</strong> na agenda do estúdio parceiro.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Tabela Principal */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4.5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Participantes com Sessões Cortesia
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Exibindo apenas participantes com triagens concluídas com concessão de sessões.
              </p>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
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
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                    <th className="py-3.5 px-6">Paciente</th>
                    <th className="py-3.5 px-4 text-center">Concedidas</th>
                    <th className="py-3.5 px-4 text-center">Utilizadas</th>
                    <th className="py-3.5 px-4 text-center">Restantes</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Histórico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants.map((participant) => {
                    const balance = calculateBalance(participant);
                    return (
                      <tr key={participant.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary font-bold text-sm">
                              {participant.name.charAt(0)}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground text-sm sm:text-base">{participant.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{participant.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4.5 px-4 text-center font-mono font-bold text-base text-foreground">
                          {balance.granted}
                        </td>

                        <td className="py-4.5 px-4 text-center font-mono text-muted-foreground font-bold text-base">
                          {balance.used}
                        </td>

                        <td className="py-4.5 px-4 text-center">
                          <span className={`font-mono text-base sm:text-lg font-bold ${balance.remaining > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            {balance.remaining}
                          </span>
                        </td>

                        <td className="py-4.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              balance.status === "Ativo"
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {balance.status}
                          </span>
                        </td>

                        <td className="py-4.5 px-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenHistory(participant)}
                            className="gap-2 text-xs sm:text-sm h-9 px-3.5 font-medium"
                          >
                            <History className="size-4" />
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
                <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  Histórico de Sessões Cortesia
                </DialogTitle>
                {activeBalance && (
                  <span
                    className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold ${
                      activeBalance.remaining > 0
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    Saldo: {activeBalance.remaining} sessão(ões) restante(s)
                  </span>
                )}
              </div>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Participante: <strong className="text-foreground">{activeSelected.name}</strong> ({activeSelected.id})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Resumo do Saldo */}
              <div className="grid grid-cols-3 gap-3.5 rounded-xl border border-border bg-secondary/30 p-4 text-center">
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Concedidas</p>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">{activeBalance?.granted}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Utilizadas</p>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-muted-foreground mt-1">{activeBalance?.used}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Saldo Restante</p>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-primary mt-1">{activeBalance?.remaining}</p>
                </div>
              </div>

              {/* Lista de Concessões */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Concessões Registradas (Triagens Concluídas)
                </h4>
                <div className="space-y-2.5">
                  {activeSelected.concessions.map((c) => (
                    <div key={c.id} className="rounded-xl border border-border bg-card p-3.5 text-sm shadow-2xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="font-semibold text-foreground">Data da Triagem: {c.date}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-bold text-xs">
                          +{c.sessions} sessão(ões) concedida(s)
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        Motivo clínico: {c.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Utilizações */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Utilizações (Atendimentos Realizados)
                </h4>
                {activeSelected.utilizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl text-center">
                    Nenhuma sessão utilizada ainda. O participante dispõe do saldo integral.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeSelected.utilizations.map((u) => (
                      <div key={u.id} className="rounded-xl border border-border bg-card p-3.5 text-sm flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <p className="font-semibold text-foreground">{u.type}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            {u.date} · {u.professional}
                          </p>
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground shrink-0">
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Button variant="outline" onClick={() => setSelectedParticipant(null)} className="text-sm h-10 px-4">
                Fechar
              </Button>
              <Button
                disabled={activeBalance?.remaining === 0}
                onClick={handleOpenScheduleFromHistory}
                className="gap-2 text-sm h-10 px-5 font-semibold"
              >
                <CalendarPlus className="size-4.5" />
                Agendar sessão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Agendamento da Sessão Cortesia */}
      {activeSelected && (
        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Agendar Atendimento Cortesia
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Agendamento pré-selecionado para <strong>{activeSelected.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmSchedule} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="sched-date" className="text-sm font-semibold">Data do atendimento</Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-time" className="text-sm font-semibold">Horário</Label>
                <Input
                  id="sched-time"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-type" className="text-sm font-semibold">Tipo de sessão</Label>
                <Input
                  id="sched-type"
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-prof" className="text-sm font-semibold">Profissional responsável</Label>
                <Input
                  id="sched-prof"
                  value={scheduleForm.professional}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, professional: e.target.value })}
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3.5 text-sm">
                <input
                  id="sched-complete"
                  type="checkbox"
                  checked={scheduleForm.markAsCompleted}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, markAsCompleted: e.target.checked })}
                  className="rounded text-primary focus:ring-primary size-4.5 cursor-pointer"
                />
                <Label htmlFor="sched-complete" className="text-sm cursor-pointer font-medium leading-relaxed">
                  Marcar como <strong>"Realizado"</strong> imediatamente (abate 1 sessão do saldo agora).
                </Label>
              </div>

              <DialogFooter className="gap-2.5 pt-3">
                <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)} className="text-sm h-10 px-4">
                  Cancelar
                </Button>
                <Button type="submit" className="text-sm h-10 px-5 font-semibold">
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-foreground px-4.5 py-3.5 text-sm font-medium text-background shadow-lg"
        >
          <Check className="size-5 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
