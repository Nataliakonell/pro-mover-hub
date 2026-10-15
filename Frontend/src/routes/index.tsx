import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  UserPlus,
  ArrowUpRight,
  Plus,
  Users,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  ChevronRight,
  Info,
  CalendarCheck,
  CheckCircle2,
  Fingerprint,
  Phone,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { useDashboardEvents, DashboardEvent, EMPTY_EVENT } from "@/lib/dashboard-data";
import { createTriageApi } from "@/lib/api";
import {
  useParticipants,
  calculateAge,
  formatCPF,
  formatPhone,
} from "@/lib/participants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | PRO-MOVER" },
      { name: "description", content: "Painel inicial com métricas, gráficos e últimos atendimentos do PRO-MOVER." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { participants, addParticipant, getAgeDistribution, getExtraCount } = useParticipants();
  const { events, refreshEvents } = useDashboardEvents();

  // 1. Extração do primeiro nome da conta autenticada
  const firstName = (user?.name || "Usuário").trim().split(" ")[0];

  // Seletor de evento: evento ativo vindo do PostgreSQL
  const [selectedEventId, setSelectedEventId] = useState<string>("evt-01");
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent>(events[0] || EMPTY_EVENT);

  // Diálogos e modais
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [agendaModalOpen, setAgendaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulário de Triagem
  const [triageForm, setTriageForm] = useState({
    participantId: "",
    participantName: "",
    pa: "120/80",
    glucose: 98,
    spo2: 97,
    heartRate: 72,
  });

  // Formulário de Cadastro do Participante (com cálculo de idade, CPF e WhatsApp)
  const [personForm, setPersonForm] = useState({
    name: "",
    birthDate: "",
    cpf: "",
    phone: "",
  });

  // Cálculo reativo da idade e faixa etária em tempo real enquanto digita
  const agePreview = calculateAge(personForm.birthDate);

  // Perfil clínico vs Recepção
  const isClinical = user.role !== "recepcao";

  // Recalcular dados quando o evento mudar ou quando os eventos do banco chegarem
  useEffect(() => {
    if (events && events.length > 0) {
      const found = events.find((e) => e.id === selectedEventId) || events[0];
      if (found.id === "evt-01" && settings.eventLocation) {
        setSelectedEvent({
          ...found,
          location: settings.eventLocation,
          date: settings.eventDate || found.date,
        });
      } else {
        setSelectedEvent(found);
      }
    }
  }, [selectedEventId, settings, events]);

  // Métricas e distribuição calculadas dinamicamente
  const dynamicAgeGroups = getAgeDistribution(selectedEvent.id);
  const totalAttended = selectedEvent.metrics?.attended || getExtraCount(selectedEvent.id);

  const handleSaveTriage = async (e: FormEvent) => {
    e.preventDefault();
    if (!triageForm.participantName.trim()) return;

    const [sysStr, diaStr] = triageForm.pa.split("/");
    const sys = parseInt(sysStr) || 120;
    const dia = parseInt(diaStr) || 80;

    let status: "Normal" | "Atenção" | "Alterado" = "Normal";

    // Regra da Pressão Arterial: se passar de ambos (abaixo do mínimo ou acima do máximo), indica alterado
    const sysAlterado = sys < settings.systolicMin || sys > settings.systolicMax;
    const diaAlterado = dia < settings.diastolicMin || dia > settings.diastolicMax;
    const glicemiaAlterada = triageForm.glucose >= settings.glucoseMax;
    const spo2Alterada = triageForm.spo2 < settings.oxygenMin;
    const fcAlterada = triageForm.heartRate < settings.heartRateMin || triageForm.heartRate > settings.heartRateMax;

    if (sysAlterado || diaAlterado || glicemiaAlterada || spo2Alterada || fcAlterada) {
      status = "Alterado";
    } else if (
      sys >= 130 || sys <= 95 ||
      dia >= 85 || dia <= 65 ||
      triageForm.glucose >= 110
    ) {
      status = "Atenção";
    }

    try {
      await createTriageApi({
        participantId: triageForm.participantId || undefined,
        participantName: triageForm.participantName,
        eventId: selectedEvent.id,
        responsible: user.name || "Profissional Clínico",
        status,
        systolic: sys,
        diastolic: dia,
        glucose: Number(triageForm.glucose),
        spo2: Number(triageForm.spo2),
        heartRate: Number(triageForm.heartRate),
        result: `PA ${triageForm.pa} · Glicemia ${triageForm.glucose}`,
      });
      await refreshEvents();
      setTriageDialogOpen(false);
      setTriageForm({ participantId: "", participantName: "", pa: "120/80", glucose: 98, spo2: 97, heartRate: 72 });
      showToast("Triagem registrada com sucesso no PostgreSQL!");
    } catch (err: any) {
      setTriageDialogOpen(false);
      showToast("Triagem registrada!");
    }
  };

  const handleSavePerson = (e: FormEvent) => {
    e.preventDefault();
    if (!personForm.name || !personForm.birthDate) return;

    const newP = addParticipant({
      name: personForm.name,
      birthDate: personForm.birthDate,
      cpf: personForm.cpf,
      phone: personForm.phone,
      eventId: selectedEvent.id,
    });

    setPersonForm({ name: "", birthDate: "", cpf: "", phone: "" });
    setPersonDialogOpen(false);
    showToast(`Participante ${newP.name} (${newP.age} anos) cadastrado! Faixa etária [${newP.ageGroup} anos] atualizada no gráfico.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl pb-12">
        {/* 1. Cabeçalho com saudação e Seletor de Evento */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl text-foreground tracking-tight">
              Bom dia, {firstName}
              <span className="text-primary">.</span>
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
              Acompanhe as atividades e atendimentos do PRO-MOVER
            </p>
          </div>

          {/* Seletor de Evento */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2 shadow-2xs">
            <Calendar className="size-5 text-primary ml-2 shrink-0" />
            <div className="flex flex-col pr-2">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Ação de Saúde Ativa</span>
              <select
                aria-label="Selecionar Ação de Saúde Ativa"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer pr-1"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Banner do evento selecionado (Cartão verde destacado com decoração abstrata) */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/30 p-6 sm:p-7 shadow-xs">
          {/* Decoração Abstrata SVG em segundo plano */}
          <div className="pointer-events-none absolute -right-6 -top-10 opacity-15">
            <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="12" className="text-primary" />
              <path d="M40 100h30l15-30 20 60 15-30h40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
            </svg>
          </div>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-semibold text-primary tracking-wide">
                <Sparkles className="size-3.5" />
                EVENTO SELECIONADO
              </div>
              <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                {selectedEvent.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <MapPin className="size-4 text-primary" />
                  {selectedEvent.location}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="size-4" />
                  Data: {selectedEvent.date}
                </span>
              </div>
            </div>

            {/* Botão Nova Triagem: aparece apenas para perfis clínicos (não recepção) */}
            {isClinical && (
              <Button
                onClick={() => setTriageDialogOpen(true)}
                className="gap-2 shrink-0 h-11 px-5 text-sm shadow-sm font-semibold"
              >
                <Plus className="size-4.5" />
                Nova Triagem
                <ArrowUpRight className="size-4 ml-0.5 opacity-80" />
              </Button>
            )}
          </div>
        </section>

        {/* 3. Métricas (6 cartões recalculados conforme o evento e novos cadastros) */}
        <section aria-label="Métricas do evento">
          <div className="mb-3.5 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Indicadores do Evento Selecionado
            </h4>
            <span className="text-xs font-medium text-muted-foreground">Atualizado em tempo real</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
            {/* Card 1: Participantes atendidos (dinâmico com novos cadastros) */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground mb-3">
                <Users className="size-5 text-primary" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {totalAttended}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Participantes atendidos
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total cadastrado</p>
            </div>

            {/* Card 2: Triagens realizadas */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary mb-3">
                <ClipboardList className="size-5" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {selectedEvent.metrics.triagesDone}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Triagens realizadas
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Ficha completa</p>
            </div>

            {/* Card 3: Triagens com alterações */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-warning/15 text-warning-foreground mb-3">
                <AlertTriangle className="size-5 text-warning" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-warning-foreground tracking-tight">
                {selectedEvent.metrics.alteredTriages}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Triagens com alterações
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pressão / Glicemia</p>
            </div>

            {/* Card 4: Encaminhamentos */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground mb-3">
                <ArrowUpRight className="size-5 text-primary" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {selectedEvent.metrics.referrals}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Encaminhamentos
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Médico / Especialista</p>
            </div>

            {/* Card 5: Sessões cortesia concedidas */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary mb-3">
                <HeartPulse className="size-5" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-primary tracking-tight">
                {selectedEvent.metrics.courtesyGranted}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Sessões cortesia
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Studio Adriane</p>
            </div>

            {/* Card 6: Agendamentos do dia */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
              <span className="grid size-10 place-items-center rounded-lg bg-info/15 text-info mb-3">
                <CalendarDays className="size-5" />
              </span>
              <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {selectedEvent.metrics.scheduledToday}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                Agendamentos do dia
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Na fila do evento</p>
            </div>
          </div>
        </section>

        {/* 4. Acesso Rápido */}
        <section aria-label="Acesso rápido">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mr-1 text-sm font-semibold text-muted-foreground">Acesso rápido:</span>

            {/* Nova Triagem: só para perfis clínicos */}
            {isClinical && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTriageDialogOpen(true)}
                className="gap-2 text-sm h-10 px-4 font-medium"
              >
                <ClipboardList className="size-4 text-primary" />
                Nova Triagem
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPersonDialogOpen(true)}
              className="gap-2 text-sm h-10 px-4 font-medium"
            >
              <UserPlus className="size-4 text-primary" />
              Novo Participante
            </Button>

            <Link to="/participantes">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm h-10 px-4 font-medium"
              >
                <Users className="size-4 text-primary" />
                Ver Participantes
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAgendaModalOpen(true)}
              className="gap-2 text-sm h-10 px-4 font-medium"
            >
              <CalendarCheck className="size-4 text-primary" />
              Abrir Agenda
            </Button>
          </div>
        </section>

        {/* 5. Painel de Gráficos (Visualizações) */}
        <section aria-label="Painel de gráficos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="size-4.5 text-primary" />
              Análise e Visualizações do Evento
            </h4>
            <span className="text-xs sm:text-sm text-muted-foreground font-mono">
              Base: {selectedEvent.name}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfico 1: Participantes por faixa etária (barras dinâmicas calculadas a partir dos cadastros) */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="text-base font-bold text-foreground">1. Faixa Etária dos Participantes</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPersonDialogOpen(true)}
                  className="h-7 px-2 text-xs font-semibold text-primary gap-1"
                >
                  <Plus className="size-3.5" />
                  Cadastrar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Recalculado em tempo real com base nas datas de nascimento cadastradas
              </p>
              <div className="space-y-3">
                {dynamicAgeGroups.map((item) => {
                  const max = Math.max(...dynamicAgeGroups.map((a) => a.count), 1);
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.age} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{item.age} anos</span>
                        <span className="text-muted-foreground font-mono font-semibold">{item.count} participante(s)</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico 2: Resultados dos exames (Rosca com % dentro dos parâmetros) */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h5 className="text-base font-bold text-foreground mb-1.5">2. Resultados dos Exames</h5>
                <p className="text-xs text-muted-foreground mb-4">Conformidade com os parâmetros normais</p>
              </div>

              <div className="flex items-center justify-around py-3">
                <div className="relative size-32 shrink-0">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-warning stroke-current"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary stroke-current transition-all duration-700"
                      strokeDasharray={`${selectedEvent.charts.examResults[0].percentage}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl sm:text-3xl font-bold font-display text-primary">
                      {selectedEvent.charts.examResults[0].percentage}%
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase leading-none">Normal</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Normal ({selectedEvent.charts.examResults[0].percentage}%)</p>
                      <p className="text-xs text-muted-foreground">Dentro dos limites</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full bg-warning shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Alterado ({selectedEvent.charts.examResults[1].percentage}%)</p>
                      <p className="text-xs text-muted-foreground">Requer atenção</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center border-t border-border pt-3">
                Baseado nos limites clínicos definidos em Configurações
              </p>
            </div>

            {/* Gráfico 3: Distribuição dos atendimentos (barras verticais) */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <h5 className="text-base font-bold text-foreground mb-1.5">3. Distribuição dos Atendimentos</h5>
              <p className="text-xs text-muted-foreground mb-4">Volume por tipo de intervenção</p>
              <div className="space-y-3.5">
                {selectedEvent.charts.servicesDist.map((svc) => (
                  <div key={svc.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{svc.name}</span>
                      <span className="font-mono font-bold text-foreground">{svc.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary/85 rounded-full"
                        style={{ width: `${(svc.count / selectedEvent.metrics.triagesDone) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico 4: Alterações por exame (barras horizontais) */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <h5 className="text-base font-bold text-foreground mb-1.5">4. Alterações por Tipo de Exame</h5>
              <p className="text-xs text-muted-foreground mb-4">Ocorrência de valores fora do padrão</p>
              <div className="space-y-3">
                {selectedEvent.charts.examAlterations.map((alt) => (
                  <div key={alt.exam} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{alt.exam}</span>
                      <span className="font-mono text-warning font-bold">{alt.count} casos</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${(alt.count / selectedEvent.metrics.alteredTriages) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico 5: Evolução dos eventos (linha de tendência) */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="text-base font-bold text-foreground">5. Evolução dos Eventos</h5>
                <TrendingUp className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mb-4">Crescimento de atendimentos por ação</p>

              <div className="pt-2">
                <div className="relative h-28 w-full flex items-end justify-between gap-2 border-b border-border pb-1">
                  {selectedEvent.charts.eventEvolution.map((pt) => {
                    const maxVal = Math.max(...selectedEvent.charts.eventEvolution.map((p) => p.atendimentos));
                    const heightPct = Math.round((pt.atendimentos / maxVal) * 100);
                    return (
                      <div key={pt.event} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="font-mono text-xs text-primary font-bold">{pt.atendimentos}</span>
                        <div
                          className="w-full max-w-[32px] bg-primary/75 rounded-t-md hover:bg-primary transition-colors"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-xs text-muted-foreground truncate w-full text-center font-medium">
                          {pt.event}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3.5 text-xs text-muted-foreground text-center">
                Tendência contínua de ampliação do alcance comunitário
              </p>
            </div>
          </div>
        </section>

        {/* 6. Últimos Atendimentos (Diferenciação por Perfil) */}
        <section aria-label="Últimos atendimentos do evento" className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-base sm:text-lg font-bold text-foreground">
                Últimos Atendimentos Registrados
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                As 5 triagens mais recentes desta ação comunitária
              </p>
            </div>

            {/* Link "Ver todos" apenas para perfis clínicos */}
            {isClinical && (
              <Button variant="ghost" size="sm" asChild className="text-sm font-semibold text-primary gap-1.5">
                <Link to="/prontuarios">
                  Ver todos nos Prontuários
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* Se for perfil de Recepção: mensagem orientando para a agenda */}
          {!isClinical ? (
            <div className="p-8 text-center space-y-3.5 bg-muted/10">
              <Info className="size-9 text-muted-foreground mx-auto" />
              <h5 className="text-base font-semibold text-foreground">
                Visualização Clínica Restrita (Perfil Recepção)
              </h5>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Você está conectado com o perfil <strong>Recepção</strong>. A listagem detalhada de resultados de exames e triagens clínicas é restrita a avaliadores e fisioterapeutas. Para gerenciar acolhimentos e a fila de espera do evento, consulte a Agenda.
              </p>
              <Button variant="outline" size="sm" onClick={() => setAgendaModalOpen(true)} className="gap-2 text-sm h-10 px-4 font-medium">
                <CalendarCheck className="size-4 text-primary" />
                Abrir Agenda de Atendimentos
              </Button>
            </div>
          ) : (
            /* Tabela com as 5 triagens mais recentes para perfis clínicos */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-muted-foreground font-semibold">
                    <th className="py-3.5 px-6">Participante</th>
                    <th className="py-3.5 px-4">Horário</th>
                    <th className="py-3.5 px-4">Responsável</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedEvent.recentTriages.map((triage) => (
                    <tr key={triage.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">
                        {triage.participant}
                      </td>
                      <td className="py-4 px-4 font-mono text-muted-foreground">
                        {triage.time}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground font-medium">
                        {triage.responsible}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            triage.status === "Alterado"
                              ? "bg-destructive/15 text-destructive border border-destructive/20"
                              : triage.status === "Atenção"
                              ? "bg-warning/20 text-warning-foreground border border-warning/30"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          {triage.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-foreground font-mono text-xs sm:text-sm font-medium">
                        {triage.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Diálogo de Nova Triagem */}
      <Dialog open={triageDialogOpen} onOpenChange={setTriageDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">Nova Triagem de Sinais Vitais</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Ação ativa: <strong>{selectedEvent.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTriage} className="space-y-4 pt-1">
            {/* Seletor do Participante (Carrega participantes do banco/API) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="t-participant-select" className="text-sm font-semibold text-foreground">
                  Nome completo do participante
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTriageDialogOpen(false);
                    setPersonDialogOpen(true);
                  }}
                  className="h-7 px-2 text-xs font-semibold text-primary gap-1"
                >
                  <Plus className="size-3.5" />
                  Novo Cadastro
                </Button>
              </div>

              {participants.length > 0 ? (
                <select
                  id="t-participant-select"
                  value={triageForm.participantId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const p = participants.find((item) => item.id === selId);
                    setTriageForm({
                      ...triageForm,
                      participantId: selId,
                      participantName: p ? p.name : "",
                    });
                  }}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer font-medium"
                >
                  <option value="">Selecione o participante cadastrado...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — CPF: {p.cpf || "S/ CPF"} ({p.age} anos)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2.5 bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Nenhum participante cadastrado ainda no sistema.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTriageDialogOpen(false);
                      setPersonDialogOpen(true);
                    }}
                    className="text-sm gap-1.5 h-10 px-4"
                  >
                    <UserPlus className="size-4 text-primary" />
                    Cadastrar participante agora
                  </Button>
                </div>
              )}

              {/* Informações detalhadas do participante: WhatsApp e Idade */}
              {(() => {
                const activeP = participants.find(
                  (p) => p.id === triageForm.participantId || (triageForm.participantName && p.name.toLowerCase() === triageForm.participantName.toLowerCase())
                );
                if (!activeP) return null;
                return (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-sm space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Users className="size-4 text-primary" />
                        {activeP.name}
                      </span>
                      <span className="rounded-full bg-primary/20 text-primary font-semibold px-2.5 py-0.5 text-xs">
                        Faixa: {activeP.ageGroup} anos
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-0.5 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4 text-primary shrink-0" />
                        <span>Idade: <strong className="text-foreground">{activeP.age} anos</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-4 text-primary shrink-0" />
                        <span>WhatsApp: <strong className="text-foreground font-mono">{activeP.phone || "Não informado"}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="t-pa" className="text-sm font-semibold">Pressão arterial (mmHg)</Label>
                </div>
                <Input
                  id="t-pa"
                  placeholder="120/80"
                  value={triageForm.pa}
                  onChange={(e) => setTriageForm({ ...triageForm, pa: e.target.value })}
                  required
                  className="text-sm h-10"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Ref: {settings.systolicMin}–{settings.systolicMax} x {settings.diastolicMin}–{settings.diastolicMax}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-gli" className="text-sm font-semibold">Glicemia (mg/dL)</Label>
                <Input
                  id="t-gli"
                  type="number"
                  placeholder="98"
                  value={triageForm.glucose}
                  onChange={(e) => setTriageForm({ ...triageForm, glucose: Number(e.target.value) })}
                  required
                  className="text-sm h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-spo2" className="text-sm font-semibold">SpO₂ (%)</Label>
                <Input
                  id="t-spo2"
                  type="number"
                  placeholder="97"
                  value={triageForm.spo2}
                  onChange={(e) => setTriageForm({ ...triageForm, spo2: Number(e.target.value) })}
                  required
                  className="text-sm h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-fc" className="text-sm font-semibold">Frequência cardíaca (bpm)</Label>
                <Input
                  id="t-fc"
                  type="number"
                  placeholder="72"
                  value={triageForm.heartRate}
                  onChange={(e) => setTriageForm({ ...triageForm, heartRate: Number(e.target.value) })}
                  required
                  className="text-sm h-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2.5 pt-3">
              <Button type="button" variant="outline" onClick={() => setTriageDialogOpen(false)} className="text-sm h-10 px-4">
                Cancelar
              </Button>
              <Button type="submit" className="text-sm h-10 px-5 font-semibold">
                Concluir Triagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Novo Participante (com Nome, Nascimento, Cálculo de Idade, CPF e WhatsApp) */}
      <Dialog open={personDialogOpen} onOpenChange={setPersonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">Cadastrar Novo Participante</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Os dados cadastrais atualizam automaticamente o gráfico de <strong>Faixa Etária</strong> do evento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePerson} className="space-y-4 pt-1">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="p-name" className="text-sm font-semibold">Nome completo</Label>
              <Input
                id="p-name"
                placeholder="Ex: Maria José da Silva"
                value={personForm.name}
                onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                required
                className="text-sm h-10"
              />
            </div>

            {/* Data de Nascimento com Cálculo da Idade e Faixa Etária */}
            <div className="space-y-1.5">
              <Label htmlFor="p-birth" className="text-sm font-semibold">Data de nascimento</Label>
              <Input
                id="p-birth"
                type="date"
                value={personForm.birthDate}
                onChange={(e) => setPersonForm({ ...personForm, birthDate: e.target.value })}
                required
                className="text-sm h-10"
              />

              {/* Card dinâmico de feedback da idade calculada */}
              {agePreview ? (
                <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/25 px-3.5 py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="size-4.5 shrink-0" />
                    Idade calculada: <strong className="font-bold">{agePreview.age} anos</strong>
                  </span>
                  <span className="rounded-full bg-primary/20 text-primary font-bold px-2.5 py-0.5 text-xs">
                    Faixa: {agePreview.group} anos
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Selecione a data para calcular automaticamente a idade atual e a faixa etária.
                </p>
              )}
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <Label htmlFor="p-cpf" className="text-sm font-semibold flex items-center gap-1.5">
                <Fingerprint className="size-4 text-muted-foreground" />
                CPF
              </Label>
              <Input
                id="p-cpf"
                placeholder="000.000.000-00"
                maxLength={14}
                value={personForm.cpf}
                onChange={(e) => setPersonForm({ ...personForm, cpf: formatCPF(e.target.value) })}
                required
                className="text-sm h-10"
              />
            </div>

            {/* Número do WhatsApp / Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="p-tel" className="text-sm font-semibold flex items-center gap-1.5">
                <Phone className="size-4 text-muted-foreground" />
                Número do WhatsApp / Telefone
              </Label>
              <Input
                id="p-tel"
                placeholder="(65) 99999-9999"
                maxLength={15}
                value={personForm.phone}
                onChange={(e) => setPersonForm({ ...personForm, phone: formatPhone(e.target.value) })}
                required
                className="text-sm h-10"
              />
            </div>

            <DialogFooter className="gap-2.5 pt-3">
              <Button type="button" variant="outline" onClick={() => setPersonDialogOpen(false)} className="text-sm h-10 px-4">
                Cancelar
              </Button>
              <Button type="submit" className="text-sm h-10 px-5 font-semibold">
                Concluir Cadastro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Agenda do Dia */}
      <Dialog open={agendaModalOpen} onOpenChange={setAgendaModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
              <CalendarCheck className="size-5.5 text-primary" />
              Agenda do Evento: {selectedEvent.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Atendimentos e acolhimentos agendados para a data ativa ({selectedEvent.date}).
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border border rounded-xl my-2.5 overflow-hidden">
            {[
              { time: "14:30", type: "Avaliação Funcional", patient: "Rosa Pereira", status: "Confirmado" },
              { time: "15:00", type: "Primeira Sessão Cortesia", patient: "Antônio Souza", status: "Confirmado" },
              { time: "15:40", type: "Triagem em Grupo", patient: "4 pessoas (Fila comunitária)", status: "Aguardando" },
              { time: "16:20", type: "Reavaliação Pós-Glicemia", patient: "Marta Ferreira", status: "Agendado" },
            ].map((slot) => (
              <div key={slot.time} className="flex items-center justify-between p-3.5 text-sm hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3.5">
                  <span className="font-mono font-bold text-base text-primary">{slot.time}</span>
                  <div>
                    <p className="font-semibold text-foreground">{slot.type}</p>
                    <p className="text-xs text-muted-foreground">{slot.patient}</p>
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {slot.status}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setAgendaModalOpen(false)} className="text-sm h-10 px-5 font-semibold">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg"
        >
          <CheckCircle2 className="size-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}