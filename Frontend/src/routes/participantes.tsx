import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import {
  Users,
  Search,
  UserPlus,
  ArrowUpRight,
  ClipboardList,
  Phone,
  MessageCircle,
  Calendar,
  Fingerprint,
  HeartPulse,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Plus,
  Info,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useParticipants,
  calculateAge,
  formatCPF,
  formatPhone,
  cleanPhoneForWhatsApp,
  Participant,
  AttendanceRecord,
} from "@/lib/participants";

export const Route = createFileRoute("/participantes")({
  head: () => ({
    meta: [
      { title: "Participantes | PRO-MOVER" },
      { name: "description", content: "Cadastro de participantes, dados de contato e histórico de presenças nas ações de saúde." },
    ],
  }),
  component: ParticipantesPage,
});

function ParticipantesPage() {
  const navigate = useNavigate();
  const { participants, addParticipant, addAttendance } = useParticipants();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("ALL");

  // Diálogo de Detalhes / Ficha do Participante
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Diálogo de Cadastro de Novo Participante
  const [newParticipantOpen, setNewParticipantOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    cpf: "",
    phone: "",
  });

  // Diálogo para adicionar novo atendimento ao histórico do participante selecionado
  const [newAttendanceOpen, setNewAttendanceOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
    type: "Triagem de Sinais Vitais",
    responsible: "Equipe PRO-MOVER",
    status: "Normal" as "Normal" | "Atenção" | "Alterado" | "Concluído",
    summary: "",
  });

  // Notificação toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  // Cálculo de idade em tempo real para o formulário de cadastro
  const calculatedAge = calculateAge(formData.birthDate);

  // Filtro de participantes
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm) ||
        p.phone.includes(searchTerm);

      const matchAge =
        selectedAgeGroup === "ALL" || p.ageGroup === selectedAgeGroup;

      return matchSearch && matchAge;
    });
  }, [participants, searchTerm, selectedAgeGroup]);

  // Estatísticas do topo
  const totalParticipants = participants.length;
  const totalAttendances = participants.reduce(
    (acc, p) => acc + (p.attendances?.length || 0),
    0
  );
  const averageAge =
    totalParticipants > 0
      ? Math.round(
          participants.reduce((acc, p) => acc + p.age, 0) / totalParticipants
        )
      : 0;

  // Submeter cadastro de participante
  const handleSaveParticipant = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.birthDate) return;

    const newP = addParticipant({
      name: formData.name,
      birthDate: formData.birthDate,
      cpf: formData.cpf,
      phone: formData.phone,
      eventId: "evt-01",
    });

    setFormData({ name: "", birthDate: "", cpf: "", phone: "" });
    setNewParticipantOpen(false);
    showToast(
      `Participante ${newP.name} cadastrado com sucesso! (${newP.age} anos · Faixa [${newP.ageGroup}])`
    );
  };

  // Submeter novo atendimento no histórico do participante
  const handleSaveAttendance = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !attendanceForm.summary.trim()) return;

    addAttendance(selectedParticipant.id, {
      eventName: attendanceForm.eventName,
      type: attendanceForm.type,
      responsible: attendanceForm.responsible,
      status: attendanceForm.status,
      summary: attendanceForm.summary,
      medicalRecordId: `PR-${selectedParticipant.id}`,
    });

    // Atualiza a visualização no modal aberto
    const updated = participants.find((p) => p.id === selectedParticipant.id);
    if (updated) {
      setSelectedParticipant(updated);
    }

    setNewAttendanceOpen(false);
    setAttendanceForm({
      eventName: "Ação de Saúde: Farmácia Popular Santa Luzia",
      type: "Triagem de Sinais Vitais",
      responsible: "Equipe PRO-MOVER",
      status: "Normal",
      summary: "",
    });
    showToast("Novo atendimento adicionado ao histórico com sucesso!");
  };

  // Abrir detalhes do participante
  const handleOpenDetails = (p: Participant) => {
    setSelectedParticipant(p);
    setDetailsOpen(true);
  };

  // Redirecionar para o Prontuário do participante
  const handleGoToMedicalRecord = (name: string) => {
    navigate({
      to: "/prontuarios",
      search: { search: name } as any,
    });
  };

  return (
    <AppLayout
      title="Participantes da Comunidade"
      subtitle="Diretório cadastral, contatos e histórico de participações nas ações de saúde"
      actions={
        <Button
          onClick={() => setNewParticipantOpen(true)}
          className="gap-1.5 text-xs font-medium"
        >
          <UserPlus className="size-4" />
          Novo Participante
        </Button>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Toast de notificação */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-3 text-xs font-medium shadow-xl transition-all">
            <CheckCircle2 className="size-4 text-primary" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 4 Cards de Métricas do Diretório de Participantes */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Cadastrado</span>
              <Users className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{totalParticipants}</span>
              <span className="text-xs text-muted-foreground">pessoas</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Atendimentos Feitos</span>
              <Activity className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{totalAttendances}</span>
              <span className="text-xs text-muted-foreground">registros</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Média de Idade</span>
              <Calendar className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{averageAge}</span>
              <span className="text-xs text-muted-foreground">anos</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium uppercase tracking-wider">Com WhatsApp</span>
              <MessageCircle className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">
                {participants.filter((p) => p.phone.length > 5).length}
              </span>
              <span className="text-xs text-muted-foreground">contatos</span>
            </div>
          </div>
        </div>

        {/* Card Didático: Diferença entre Participantes e Prontuários */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs">
          <div className="flex items-start gap-3">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                Diferença entre Participantes e Prontuários:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Nesta tela você gerencia os <strong>dados cadastrais, contatos via WhatsApp e o histórico de presenças</strong> do participante.
                Para consultar aferições de sinais vitais detalhadas, hipóteses diagnósticas e evoluções clínicas, clique em <strong>"Ir até o prontuário"</strong> na ficha de cada um.
              </p>
            </div>
          </div>
          <Link
            to="/prontuarios"
            className="shrink-0 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            Ver tela de Prontuários
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Faixa Etária:</span>
            {["ALL", "18–30", "31–45", "46–60", "60+"].map((group) => (
              <button
                key={group}
                onClick={() => setSelectedAgeGroup(group)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedAgeGroup === group
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {group === "ALL" ? "Todas" : `${group} anos`}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Participantes */}
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Participantes Encontrados ({filteredParticipants.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Clique no nome ou em "Ver Histórico" para ver as participações
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-muted-foreground font-medium">
                  <th className="py-3 px-6">Participante</th>
                  <th className="py-3 px-4">Idade & Nascimento</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">WhatsApp / Telefone</th>
                  <th className="py-3 px-4 text-center">Atendimentos</th>
                  <th className="py-3 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum participante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const count = p.attendances?.length || 0;
                    const latestAttendance = p.attendances?.[0];

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-accent/40 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetails(p)}
                      >
                        {/* Participante (Nome + Avatar + Badge) */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary font-semibold text-xs shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Cadastrado em {p.createdAt}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Idade & Data de Nascimento */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {p.age} anos
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.birthDate ? p.birthDate.split("-").reverse().join("/") : "—"} · [{p.ageGroup}]
                            </span>
                          </div>
                        </td>

                        {/* CPF */}
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          {p.cpf || "Não informado"}
                        </td>

                        {/* WhatsApp / Telefone */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          {p.phone ? (
                            <a
                              href={`https://wa.me/${cleanPhoneForWhatsApp(p.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir conversa no WhatsApp"
                              className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-emerald-600 transition-colors"
                            >
                              <MessageCircle className="size-3.5 text-emerald-500 shrink-0" />
                              <span className="font-mono">{p.phone}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Total de Atendimentos */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              count > 1
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : count === 1
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {count} {count === 1 ? "atendimento" : "atendimentos"}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(p)}
                              className="h-7 text-xs px-2.5 gap-1"
                            >
                              <History className="size-3 text-muted-foreground" />
                              Ver Histórico
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGoToMedicalRecord(p.name)}
                              className="h-7 text-xs px-2 text-primary hover:text-primary gap-1"
                              title="Ir para o Prontuário Clínico"
                            >
                              <ClipboardList className="size-3.5" />
                              Prontuário
                              <ArrowUpRight className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Ficha do Participante & Histórico de Atendimentos */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedParticipant && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-primary/20 text-primary font-bold text-base shrink-0">
                      {selectedParticipant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <DialogTitle className="font-display text-xl font-normal">
                        {selectedParticipant.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-0.5">
                        {selectedParticipant.age} anos · Faixa etária [{selectedParticipant.ageGroup} anos] · ID: {selectedParticipant.id}
                      </DialogDescription>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {selectedParticipant.attendances?.length || 0} Atendimentos
                  </span>
                </div>
              </DialogHeader>

              {/* Informações Cadastrais e de Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <Fingerprint className="size-3 text-primary" />
                    CPF
                  </span>
                  <p className="font-mono text-xs font-medium text-foreground">
                    {selectedParticipant.cpf || "Não informado"}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3 text-primary" />
                    Nascimento
                  </span>
                  <p className="text-xs font-medium text-foreground">
                    {selectedParticipant.birthDate
                      ? selectedParticipant.birthDate.split("-").reverse().join("/")
                      : "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="size-3 text-emerald-500" />
                    WhatsApp
                  </span>
                  {selectedParticipant.phone ? (
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(selectedParticipant.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono font-medium text-emerald-600 hover:underline block truncate"
                    >
                      {selectedParticipant.phone}
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não informado</p>
                  )}
                </div>
              </div>

              {/* Box Informativo: Conexão com o Prontuário */}
              <div className="rounded-lg border border-border bg-secondary/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <ClipboardList className="size-4 text-primary" />
                    Prontuário Clínico deste Participante
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Para conferir os valores aferidos de PA, Glicemia, SpO₂ e as anotações do profissional:
                  </p>
                </div>
                <Button
                  onClick={() => handleGoToMedicalRecord(selectedParticipant.name)}
                  className="gap-1.5 text-xs font-medium shrink-0 shadow-2xs"
                >
                  Ir até o Prontuário
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>

              {/* Linha do Tempo: Histórico de Atendimentos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="size-3.5 text-primary" />
                    Histórico de Atendimentos & Presenças ({selectedParticipant.attendances?.length || 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewAttendanceOpen(true)}
                    className="h-7 text-[11px] gap-1 text-primary"
                  >
                    <Plus className="size-3" />
                    Novo Atendimento
                  </Button>
                </div>

                {(!selectedParticipant.attendances || selectedParticipant.attendances.length === 0) ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    Nenhum atendimento anterior registrado para este participante.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedParticipant.attendances.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="rounded-lg border border-border bg-card p-3.5 space-y-2 transition-all hover:border-primary/40"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {att.type}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground font-medium">
                              {att.eventName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {att.date}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                att.status === "Alterado"
                                  ? "bg-destructive/15 text-destructive"
                                  : att.status === "Atenção"
                                  ? "bg-warning/20 text-warning-foreground"
                                  : att.status === "Concluído"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {att.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {att.summary}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                          <span>Responsável: <strong>{att.responsible}</strong></span>
                          {att.medicalRecordId && (
                            <button
                              onClick={() => handleGoToMedicalRecord(selectedParticipant.name)}
                              className="text-primary hover:underline font-mono text-[10px] inline-flex items-center gap-1"
                            >
                              {att.medicalRecordId}
                              <ArrowUpRight className="size-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between pt-2 border-t border-border">
                {selectedParticipant.phone ? (
                  <Button
                    variant="outline"
                    asChild
                    className="text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(selectedParticipant.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-3.5" />
                      Falar no WhatsApp
                    </a>
                  </Button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                    className="text-xs"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => handleGoToMedicalRecord(selectedParticipant.name)}
                    className="text-xs gap-1"
                  >
                    <ClipboardList className="size-3.5" />
                    Abrir Prontuário
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Cadastro de Novo Participante */}
      <Dialog open={newParticipantOpen} onOpenChange={setNewParticipantOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-normal">
              Cadastrar Novo Participante
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados de identificação e contato. A idade e a faixa etária são calculadas automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveParticipant} className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="part-name" className="text-xs font-medium">Nome completo</Label>
              <Input
                id="part-name"
                placeholder="Ex: Maria José de Oliveira"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Data de Nascimento com feedback de Idade */}
            <div className="space-y-1.5">
              <Label htmlFor="part-birth" className="text-xs font-medium">Data de nascimento</Label>
              <Input
                id="part-birth"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />

              {calculatedAge ? (
                <div className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/25 px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-primary font-medium">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Idade calculada: <strong>{calculatedAge.age} anos</strong>
                  </span>
                  <span className="rounded bg-primary/20 text-primary font-semibold px-2 py-0.5 text-[10px]">
                    Faixa: {calculatedAge.group} anos
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Selecione a data para calcular automaticamente a idade e a faixa etária.
                </p>
              )}
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <Label htmlFor="part-cpf" className="text-xs font-medium flex items-center gap-1.5">
                <Fingerprint className="size-3.5 text-muted-foreground" />
                CPF
              </Label>
              <Input
                id="part-cpf"
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                required
              />
            </div>

            {/* WhatsApp / Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="part-phone" className="text-xs font-medium flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                Número do WhatsApp / Telefone
              </Label>
              <Input
                id="part-phone"
                placeholder="(65) 99999-9999"
                maxLength={15}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewParticipantOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" className="text-xs">
                Concluir Cadastro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Adicionar Atendimento no Histórico */}
      <Dialog open={newAttendanceOpen} onOpenChange={setNewAttendanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-normal">
              Registrar Atendimento / Participação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione um novo registro à linha do tempo de <strong>{selectedParticipant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAttendance} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="att-event" className="text-xs font-medium">Ação / Local do Evento</Label>
              <Input
                id="att-event"
                value={attendanceForm.eventName}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, eventName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-type" className="text-xs font-medium">Tipo de Atendimento</Label>
                <select
                  id="att-type"
                  value={attendanceForm.type}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Triagem de Sinais Vitais">Triagem de Sinais Vitais</option>
                  <option value="Avaliação Funcional">Avaliação Funcional</option>
                  <option value="Sessão Cortesia">Sessão Cortesia</option>
                  <option value="Orientações Posturais">Orientações Posturais</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="att-status" className="text-xs font-medium">Resultado</Label>
                <select
                  id="att-status"
                  value={attendanceForm.status}
                  onChange={(e) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Normal">Normal</option>
                  <option value="Atenção">Atenção</option>
                  <option value="Alterado">Alterado</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-resp" className="text-xs font-medium">Profissional Responsável</Label>
              <Input
                id="att-resp"
                placeholder="Ex: Dra. Adriane Câmara"
                value={attendanceForm.responsible}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, responsible: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-sum" className="text-xs font-medium">Resumo do Atendimento</Label>
              <Input
                id="att-sum"
                placeholder="Ex: Pressão aferida, orientações ergonômicas passadas..."
                value={attendanceForm.summary}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, summary: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewAttendanceOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" className="text-xs">
                Salvar Atendimento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
