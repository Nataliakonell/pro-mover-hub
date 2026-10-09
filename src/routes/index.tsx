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
  const [active, setActive] = useState("Painel");
  const [toast, setToast] = useState("");

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(dialog === "triage" ? "Triagem registrada com sucesso." : "Participante cadastrado com sucesso.");
    setDialog(null);
    window.setTimeout(() => setToast(""), 3200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="bg-card px-6 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-6 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><HeartPulse className="size-5" strokeWidth={1.5} /></span>
            <div className="min-w-0"><h1 className="truncate font-display text-lg font-medium">PRO-MOVER</h1><p className="mt-0.5 text-xs text-muted-foreground">Saúde comunitária</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">Adriane Câmara</span><span className="grid size-9 place-items-center rounded-full bg-accent text-xs text-accent-foreground">AC</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-7 sm:px-10 lg:px-16 lg:pt-10">
        <nav aria-label="Navegação do painel" className="flex gap-2">
          {[{ name: "Painel", icon: LayoutDashboard }, { name: "Triagem", icon: HeartPulse }, { name: "Agenda", icon: CalendarDays }].map(({ name, icon: Icon }) => <Button key={name} variant="ghost" onClick={() => setActive(name)} aria-pressed={active === name} className={`gap-2 px-3 font-normal ${active === name ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}><Icon strokeWidth={1.5} />{name}</Button>)}
        </nav>

        <section className="mt-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 sm:flex sm:items-center sm:justify-between lg:mt-14">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary-foreground" />Evento em andamento</div>
            <h2 className="font-display text-3xl font-light leading-tight sm:text-4xl">{active === "Painel" ? "Ação de saúde Santa Luzia" : active === "Triagem" ? "Triagem comunitária" : "Agenda do dia"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Studio Adriane Câmara · Farmácia Popular Santa Luzia</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={() => setDialog("person")} aria-label="Cadastrar participante" className="font-normal text-muted-foreground"><UserPlus strokeWidth={1.5} /><span className="hidden lg:inline">Cadastrar</span></Button>
            <Button onClick={() => setDialog("triage")} aria-label="Nova triagem" className="h-10 font-normal"><Plus strokeWidth={1.5} /><span className="hidden sm:inline">Nova triagem</span></Button>
          </div>
        </section>

        {active === "Painel" && <section aria-label="Resumo do evento" className="my-10 grid grid-cols-3 gap-5 py-5 sm:my-12 sm:gap-12">
          {[['Participantes', '22', 'registrados'], ['Concluídos', '11', 'atendimentos'], ['Aguardando', '4', 'para triagem']].map(([label, value, detail]) => <div key={label} className="min-w-0"><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-3 font-display text-4xl font-light sm:text-5xl">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>)}
        </section>}

        <div className={`grid gap-12 ${active === "Painel" ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "mt-12"}`}>
          {active !== "Agenda" && <section className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-display text-base font-medium">Precisam de atenção</h3><span className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">3 participantes</span></div>
            <div className="divide-y divide-border">{alerts.map((alert) => <AlertRow key={alert.time} {...alert} onAction={() => setToast(`Prontuário de ${alert.name} aberto.`)} />)}</div>
          </section>}
          {active !== "Triagem" && <section className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-display text-base font-medium">Próximos atendimentos</h3><CalendarDays className="size-4 text-muted-foreground" strokeWidth={1.5} /></div>
            <div className="divide-y divide-border">{appointments.map(([time, title, person]) => <Button variant="ghost" key={time} onClick={() => setToast(`${title}: ${person}.`)} className="grid h-auto w-full grid-cols-[3rem_minmax(0,1fr)_auto] gap-3 whitespace-normal rounded-none px-0 py-5 text-left font-normal hover:bg-muted"><span className="self-start pt-1 text-xs text-muted-foreground">{time}</span><span className="min-w-0"><span className="block text-sm">{title}</span><span className="mt-1.5 block text-xs text-muted-foreground">{person}</span></span><ArrowUpRight className="text-muted-foreground" strokeWidth={1.5} /></Button>)}</div>
          </section>}
        </div>
        <footer className="mt-14 text-xs text-muted-foreground">PRO-MOVER <span className="mx-2">·</span> Cuidado próximo, movimento para todos.</footer>
      </main>
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