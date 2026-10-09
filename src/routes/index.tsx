import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  UserPlus,
  ArrowUpRight,
  Plus,
  Activity,
  Users,
  Gift,
  ChartNoAxesCombined,
  Settings,
  ShieldCheck,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useState, type FormEvent } from "react";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel Comunitário | PRO-MOVER" },
      { name: "description", content: "Painel de triagem comunitária, prontuários e atendimentos do PRO-MOVER." },
      { property: "og:title", content: "Painel Comunitário | PRO-MOVER" },
      { property: "og:description", content: "Triagem comunitária e gestão de atendimentos em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const alerts = [
  { time: "14:18", name: "Marta Ferreira", result: "Glicemia 214 mg/dL", note: "encaminhar para avaliação profissional", tone: "danger" },
  { time: "14:05", name: "Antônio Souza", result: "Pressão 152/94 mmHg", note: "reavaliar em 15 min · oximetria 96%", tone: "warning" },
  { time: "13:52", name: "Rosa Pereira", result: "IMC 31,2", note: "avaliação funcional agendada", tone: "info" },
] as const;

const appointments = [
  ["14:30", "Avaliação funcional", "Rosa Pereira"],
  ["15:00", "Primeira sessão", "Antônio Souza"],
  ["15:40", "Triagem em grupo", "4 pessoas"],
] as const;

function Dashboard() {
  const [dialog, setDialog] = useState<"triage" | "person" | null>(null);
  const [active, setActive] = useState("Dashboard");
  const [toast, setToast] = useState("");

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(dialog === "triage" ? "Triagem registrada com sucesso." : "Participante cadastrado com sucesso.");
    setDialog(null);
    window.setTimeout(() => setToast(""), 3200);
  };

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Ação de Saúde", icon: HeartPulse },
    { name: "Participantes", icon: Users },
    { name: "Prontuários", icon: ClipboardList },
    { name: "Agenda", icon: CalendarDays },
    { name: "Sessões Cortesia", icon: Gift },
    { name: "Indicadores", icon: ChartNoAxesCombined },
  ];
  const metrics = [
    { label: "Participantes registrados", value: "22", detail: "Pessoas acolhidas no evento", icon: Users, tone: "bg-secondary text-secondary-foreground" },
    { label: "Atendimentos concluídos", value: "11", detail: "Avaliações finalizadas", icon: ClipboardList, tone: "bg-accent text-accent-foreground" },
    { label: "Exames com alterações", value: "3", detail: "Precisam de acompanhamento", icon: AlertTriangle, tone: "bg-warning text-warning-foreground" },
    { label: "Encaminhamentos", value: "2", detail: "Para avaliação especializada", icon: ArrowUpRight, tone: "bg-lilac text-lilac-foreground" },
    { label: "Aguardando triagem", value: "4", detail: "Próximos na fila de cuidado", icon: HeartPulse, tone: "bg-secondary text-secondary-foreground" },
    { label: "Agendamentos do dia", value: "3", detail: "Atendimentos na agenda", icon: CalendarDays, tone: "bg-info text-info-foreground" },
  ];
  const overview = active === "Dashboard" || active === "Ação de Saúde";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="bg-card px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-border md:py-8">
        <div className="flex min-w-0 items-center gap-3 px-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="size-6" strokeWidth={1.8} /></span>
          <div className="min-w-0"><h1 className="truncate font-display text-lg font-semibold">PRO-MOVER.</h1><p className="mt-1 text-[9px] uppercase text-muted-foreground">Saúde em movimento</p></div>
        </div>
        <p className="mb-3 mt-9 hidden px-2 text-[10px] uppercase text-muted-foreground md:block">Área de trabalho</p>
        <nav aria-label="Navegação do painel" className="mt-5 flex gap-1 overflow-x-auto md:mt-0 md:flex-col md:overflow-visible">
          {navigation.map(({name, icon: Icon}) => <Button key={name} variant="ghost" onClick={() => setActive(name)} aria-pressed={active === name} className={`h-11 shrink-0 justify-start gap-3 px-3 text-xs font-normal ${active === name ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}><Icon strokeWidth={1.6} />{name}{name === "Ação de Saúde" && <span className="ml-auto hidden size-1.5 rounded-full bg-primary md:block" />}</Button>)}
          <Button variant="ghost" className="h-11 shrink-0 justify-start gap-3 px-3 text-xs font-normal text-muted-foreground" onClick={() => setToast("Ambiente demonstrativo · configurações não disponíveis.")}><Settings strokeWidth={1.6} />Configurações</Button>
        </nav>
        <div className="mt-auto hidden pt-6 md:block"><div className="border-t border-border px-2 pt-5"><HeartPulse className="mb-3 size-5 text-primary" strokeWidth={1.5} /><p className="text-xs font-medium">Cuidar conecta pessoas.</p><p className="mt-2 text-[11px] leading-6 text-muted-foreground">Studio Adriane Câmara<br />Farmácia Popular Santa Luzia</p></div></div>
      </aside>
      <div className="min-w-0">
        <header className="grid h-[74px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-5 lg:px-8">
          <p className="truncate text-xs"><span className="text-muted-foreground">Plataforma comunitária <span className="mx-3">/</span></span>{active}</p>
          <span className="flex shrink-0 items-center gap-2 rounded-full border border-primary/10 bg-secondary/60 px-3 py-2 text-[10px] text-secondary-foreground"><ShieldCheck className="size-3.5" /><span className="hidden sm:inline">Ambiente demonstrativo</span></span>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">
          <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Seu cuidado faz a diferença</p><h2 className="mt-2 font-display text-2xl font-medium sm:text-[28px]">{active === "Dashboard" ? <>Bom dia, Natália<span className="text-primary">.</span></> : active}</h2><p className="mt-2 text-sm text-muted-foreground">Acompanhe as atividades do PRO-MOVER</p></div>
            <Button variant="outline" className="h-10 gap-3 font-normal" onClick={() => setActive("Ação de Saúde")}><CalendarDays className="text-primary" /><span className="hidden xl:inline">Ação comunitária · em andamento</span><ChevronDown className="hidden sm:block" /></Button>
          </section>

          {(overview || active === "Indicadores") && <>
            <section className="relative mt-7 overflow-hidden rounded-lg bg-secondary px-6 py-7 sm:px-7">
              <HeartPulse aria-hidden="true" className="pointer-events-none absolute -right-3 top-0 hidden size-40 text-primary/10 lg:block" strokeWidth={0.7} />
              <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0"><span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-[10px] text-secondary-foreground"><span className="size-1.5 rounded-full bg-primary" />EVENTO SELECIONADO</span><h3 className="mt-4 font-display text-lg font-medium">Ação de Saúde Comunitária</h3><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><CalendarDays className="size-3.5" />Em andamento</span><span className="flex items-center gap-2"><MapPin className="size-3.5" />Farmácia Popular Santa Luzia</span></div></div>
                <Button onClick={() => setDialog("triage")} aria-label="Nova triagem" className="h-11 w-fit gap-3 px-5"><Plus />Nova Triagem<ArrowUpRight /></Button>
              </div>
            </section>
            <section aria-label="Resumo do evento" className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
              {metrics.map(({label,value,detail,icon: Icon,tone}) => <div key={label} className="min-w-0 rounded-lg border border-border bg-card p-5"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><span className={`grid size-10 place-items-center rounded-lg ${tone}`}><Icon className="size-5" strokeWidth={1.6} /></span><span className="pt-1 text-[9px] text-muted-foreground">Neste evento</span></div><p className="mt-4 font-display text-3xl font-normal">{value}</p><p className="mt-2 text-xs leading-5">{label}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{detail}</p></div>)}
            </section>
          </>}

          <div className="my-6 flex flex-wrap items-center gap-2"><span className="mr-2 text-xs text-muted-foreground">Acesso rápido</span><Button variant="outline" onClick={() => setDialog("person")} className="font-normal"><UserPlus />Novo participante</Button><Button variant="outline" onClick={() => setDialog("triage")} className="font-normal"><ClipboardList />Registrar triagem</Button><Button variant="outline" onClick={() => setActive("Agenda")} className="font-normal"><CalendarDays />Ver agenda</Button></div>

          {(overview || active === "Prontuários" || active === "Agenda") && <div className={`mt-8 grid gap-10 ${overview ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" : ""}`}>
            {active !== "Agenda" && <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-base font-medium">Acompanhamentos prioritários</h3><span className="rounded-md bg-warning px-2 py-1 text-[10px] text-warning-foreground">3 alterações</span></div><div className="divide-y divide-border">{alerts.map((alert) => <AlertRow key={alert.time} {...alert} onAction={() => setToast(`Prontuário de ${alert.name} aberto em demonstração.`)} />)}</div></section>}
            {active !== "Prontuários" && <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-base font-medium">Agenda do dia</h3><CalendarDays className="size-4 text-primary" strokeWidth={1.5} /></div><div className="divide-y divide-border">{appointments.map(([time,title,person]) => <Button variant="ghost" key={time} onClick={() => setToast(`${title}: ${person}.`)} className="grid h-auto w-full grid-cols-[3rem_minmax(0,1fr)_auto] gap-3 whitespace-normal rounded-none px-0 py-5 text-left font-normal"><span className="self-start pt-1 text-xs text-primary">{time}</span><span className="min-w-0"><span className="block text-sm">{title}</span><span className="mt-1.5 block text-xs text-muted-foreground">{person}</span></span><ArrowUpRight className="text-muted-foreground" strokeWidth={1.5} /></Button>)}</div></section>}
          </div>}
          {active === "Participantes" && <section className="mt-8"><h3 className="mb-3 font-display text-base">Participantes recentes</h3><div className="divide-y divide-border">{alerts.map(({name}) => <div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5"><span className="text-sm">{name}</span><Button variant="ghost" size="icon" aria-label={`Ver participante ${name}`} onClick={() => setToast(`Cadastro de ${name} · demonstração.`)}><ArrowUpRight /></Button></div>)}</div></section>}
          {active === "Sessões Cortesia" && <section className="mt-8 py-8"><Gift className="mb-4 size-7 text-primary" strokeWidth={1.5} /><h3 className="font-display text-lg">Sessões cortesia</h3><p className="mt-3 text-sm text-muted-foreground">Nenhuma sessão cortesia registrada neste evento.</p></section>}
        </main>
      </div>
      <EntryDialog mode={dialog} open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} onSave={save} />
      {toast && <div role="status" className="fixed bottom-5 left-5 right-5 z-50 rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground sm:left-auto">{toast}</div>}
    </div>
  );
}

function AlertRow({ time, name, result, note, tone, onAction }: typeof alerts[number] & { onAction: () => void }) {
  const styles = tone === "danger" ? "bg-destructive text-destructive-foreground" : tone === "warning" ? "bg-warning text-warning-foreground" : "bg-info text-info-foreground";
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5"><div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${styles}`}><AlertTriangle className="size-3.5" strokeWidth={1.5} /></span><div className="min-w-0"><p className="text-sm font-medium">{name}</p><p className="mt-1.5 text-xs text-muted-foreground">{result} <span className="mx-1">·</span> {time}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p></div></div><Button title={`Abrir prontuário de ${name}`} aria-label={`Abrir prontuário de ${name}`} size="icon" variant="ghost" className="shrink-0 text-muted-foreground" onClick={onAction}><ArrowUpRight strokeWidth={1.5} /></Button></div>;
}

function EntryDialog({ mode, open, onOpenChange, onSave }: { mode: "triage" | "person" | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  const isTriage = mode === "triage";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg shadow-none"><DialogHeader><DialogTitle className="font-display text-2xl font-normal">{isTriage ? "Nova triagem" : "Novo participante"}</DialogTitle><DialogDescription>{isTriage ? "Registre os sinais vitais coletados durante a ação." : "Cadastre os dados essenciais para criar o prontuário."}</DialogDescription></DialogHeader><form onSubmit={onSave} className="grid gap-4"><Field label="Nome completo" id="name" placeholder="Nome do participante" />{isTriage ? <div className="grid grid-cols-2 gap-3"><Field label="Pressão arterial" id="pressure" placeholder="120/80" /><Field label="Glicemia (mg/dL)" id="glucose" type="number" placeholder="98" /><Field label="Oximetria (%)" id="oxygen" type="number" placeholder="97" /><Field label="Frequência cardíaca" id="heart" type="number" placeholder="72" /><Field label="Peso (kg)" id="weight" type="number" placeholder="70" /><Field label="Altura (cm)" id="height" type="number" placeholder="168" /></div> : <><Field label="Data de nascimento" id="birth" type="date" /><Field label="Telefone" id="phone" type="tel" placeholder="(65) 99999-9999" /><Field label="Contato de emergência" id="emergency" placeholder="Nome e telefone" /></>}<DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">Salvar {isTriage ? "triagem" : "cadastro"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, id, ...props }: { label: string; id: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} required {...props} /></div>;
}