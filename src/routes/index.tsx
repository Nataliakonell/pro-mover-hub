import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Search,
  UserPlus,
  Users,
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
  const [mobileNav, setMobileNav] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(dialog === "triage" ? "Triagem registrada com sucesso." : "Participante cadastrado com sucesso.");
    setDialog(null);
    window.setTimeout(() => setToast(""), 3200);
  };

  return (
    <div className="flex min-h-screen bg-paper text-foreground antialiased">
      <aside className="hidden w-[92px] shrink-0 flex-col items-center border-r border-border bg-card py-5 md:flex">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary font-display text-2xl text-primary-foreground">PM</div>
        <Nav active={active} onSelect={setActive} />
        <div className="mt-auto grid place-items-center gap-2">
          <div className="grid size-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">AC</div>
          <span className="text-[9px] font-medium uppercase text-muted-foreground">Adm</span>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur md:px-7">
          <Button aria-label="Abrir menu" variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNav(!mobileNav)}><Menu /></Button>
          <div className="min-w-0">
            <h1 className="font-display text-2xl uppercase leading-none">PRO-MOVER</h1>
            <p className="mt-1 hidden text-[10px] font-medium uppercase text-muted-foreground sm:block">Studio Adriane Câmara · Farmácia Popular Santa Luzia</p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-2 lg:flex">
            <span className="size-2 rounded-full bg-destructive" />
            <span className="text-xs font-semibold text-destructive">3 exames alterados</span>
          </div>
          <Button variant="ink" className="px-3 sm:px-4" onClick={() => setDialog("triage")}><ClipboardList /><span className="hidden sm:inline">Nova triagem</span></Button>
          <Button className="rounded-full px-3 shadow-none sm:px-4" onClick={() => setDialog("person")}><UserPlus /><span className="hidden sm:inline">Cadastrar</span></Button>
          {mobileNav && <div className="absolute left-3 top-16 rounded-xl border border-border bg-card p-2 shadow-lg md:hidden"><Nav active={active} onSelect={(item) => { setActive(item); setMobileNav(false); }} /></div>}
        </header>

        <main className="space-y-4 px-4 py-5 md:px-7">
          <section className="animate-rise flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"><span className="size-2 animate-pulse rounded-full bg-info" /> Evento ativo · agora</div>
              <h2 className="mt-3 text-balance font-display text-4xl uppercase leading-[0.95] md:text-5xl">Ação de saúde<br />Santa Luzia</h2>
              <p className="mt-2 max-w-[48ch] text-sm text-muted-foreground">22 participantes registrados · 11 concluídos · 4 aguardando triagem.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="soft" onClick={() => setDialog("triage")}><HeartPulse /> Nova triagem</Button>
                <Button variant="teal" onClick={() => setDialog("person")}><UserPlus /> Novo cadastro</Button>
              </div>
            </div>
            <div className="w-full shrink-0 rounded-xl border border-border bg-paper p-4 lg:w-[290px]">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Último exame · Marta Ferreira</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2 font-mono"><span className="text-3xl font-medium text-primary">128/82</span><span className="text-xs text-muted-foreground">mmHg · normal</span></div>
              <div className="mt-4 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-border"><div className="h-full w-3/5 rounded-full bg-primary" /></div><span className="font-mono text-[10px] text-muted-foreground">60%</span></div>
              <p className="mt-2 text-xs text-muted-foreground">Fluxo do evento concluído</p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Participantes", "22", "+6 desde manhã", "bg-primary text-primary-foreground"],
              ["Exames alterados", "3", "1 glicemia · 2 pressão", "bg-warning text-warning-foreground"],
              ["Encaminhamentos", "2", "para o estúdio", "bg-info text-info-foreground"],
              ["Assiduidade", "78%", "meta 85%", "bg-destructive text-destructive-foreground"],
            ].map(([label, value, detail, tone], index) => <div key={label} style={{ animationDelay: `${60 + index * 60}ms` }} className={`animate-rise min-h-36 rounded-2xl p-4 ${tone}`}><p className="text-[10px] font-semibold uppercase opacity-80">{label}</p><p className="mt-2 font-display text-5xl leading-none">{value}</p><p className="mt-2 text-xs opacity-80">{detail}</p></div>)}
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
              <div className="flex items-center justify-between"><h3 className="font-display text-lg uppercase">Alertas recentes</h3><AlertTriangle className="size-4 text-destructive" /></div>
              <div className="mt-3 space-y-2">{alerts.map((alert) => <AlertRow key={alert.time} {...alert} onAction={() => setToast(`Prontuário de ${alert.name} aberto.`)} />)}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between"><h3 className="font-display text-lg uppercase">Agenda do dia</h3><CalendarDays className="size-4 text-info" /></div>
              <div className="mt-3 space-y-2">{appointments.map(([time, title, person], index) => <button key={time} onClick={() => setToast(`${title}: ${person}.`)} className="flex w-full gap-3 rounded-xl border border-border bg-paper p-3 text-left transition-colors hover:bg-muted"><span className={`w-11 shrink-0 font-mono text-xs font-medium ${index === 0 ? "text-primary" : "text-info"}`}>{time}</span><span className="text-sm"><strong className="block font-medium">{title}</strong><span className="text-xs text-muted-foreground">{person}</span></span></button>)}</div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4"><h3 className="font-display text-lg uppercase">Distribuição dos resultados</h3><div className="mt-4 space-y-4">{[["Normal", "14 · 64%", "w-[64%] bg-primary", "text-primary"], ["Atenção", "5 · 23%", "w-[23%] bg-warning", "text-warning"], ["Alterado", "3 · 13%", "w-[13%] bg-destructive", "text-destructive"]].map(([label, value, width, text]) => <div key={label}><div className="mb-1 flex justify-between text-xs"><span className={`font-medium ${text}`}>{label}</span><span className="font-mono text-muted-foreground">{value}</span></div><div className="h-3 overflow-hidden rounded-full bg-border"><div className={`h-full rounded-full ${width}`} /></div></div>)}</div></div>
            <div className="rounded-2xl border border-border bg-card p-4"><h3 className="font-display text-lg uppercase">Faixas etárias</h3><div className="mt-4 flex h-28 items-end gap-3">{[["18–30", "h-[38%]", "bg-info"], ["31–45", "h-[62%]", "bg-primary"], ["46–60", "h-[88%]", "bg-primary"], ["60+", "h-full", "bg-info"]].map(([label, height, tone]) => <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><div className={`w-full rounded-t-md ${height} ${tone}`} /><span className="font-mono text-[10px] text-muted-foreground">{label}</span></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Maior procura: 46–60 anos · 9 pessoas nesta faixa.</p></div>
          </section>
        </main>
      </div>

      <EntryDialog mode={dialog} open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} onSave={save} />
      {toast && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">{toast}</div>}
    </div>
  );
}

const navItems = [{ name: "Painel", icon: LayoutDashboard }, { name: "Triagem", icon: HeartPulse }, { name: "Agenda", icon: CalendarDays }, { name: "Pessoas", icon: Users }, { name: "Buscar", icon: Search }];

function Nav({ active, onSelect }: { active: string; onSelect: (item: string) => void }) {
  return <nav className="mt-5 flex flex-col gap-1">{navItems.map(({ name, icon: Icon }) => <Button key={name} title={name} aria-label={name} variant="ghost" onClick={() => onSelect(name)} className={`h-14 w-16 flex-col gap-1 rounded-xl px-1 text-[10px] ${active === name ? "bg-secondary text-primary hover:bg-secondary" : "text-muted-foreground"}`}><Icon className="size-4" />{name}</Button>)}</nav>;
}

function AlertRow({ time, name, result, note, tone, onAction }: typeof alerts[number] & { onAction: () => void }) {
  const styles = tone === "danger" ? "bg-destructive/10 border-destructive/20" : tone === "warning" ? "bg-warning/20 border-warning/30" : "bg-accent border-info/20";
  const text = tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning-foreground" : "text-info";
  return <div className={`flex items-center gap-3 rounded-xl border p-3 ${styles}`}><span className={`w-12 shrink-0 font-mono text-xs font-medium ${text}`}>{time}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{name} — {result}</p><p className="text-xs text-muted-foreground">{note}</p></div><Button aria-label={`Abrir prontuário de ${name}`} size="sm" variant={tone === "danger" ? "destructive" : tone === "warning" ? "outline" : "teal"} onClick={onAction}>Ver</Button></div>;
}

function EntryDialog({ mode, open, onOpenChange, onSave }: { mode: "triage" | "person" | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  const isTriage = mode === "triage";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle className="font-display text-2xl uppercase">{isTriage ? "Nova triagem" : "Novo participante"}</DialogTitle><DialogDescription>{isTriage ? "Registre os sinais vitais coletados durante a ação." : "Cadastre os dados essenciais para criar o prontuário."}</DialogDescription></DialogHeader><form onSubmit={onSave} className="grid gap-4"><Field label="Nome completo" id="name" placeholder="Nome do participante" />{isTriage ? <div className="grid grid-cols-2 gap-3"><Field label="Pressão arterial" id="pressure" placeholder="120/80" /><Field label="Glicemia (mg/dL)" id="glucose" type="number" placeholder="98" /><Field label="Oximetria (%)" id="oxygen" type="number" placeholder="97" /><Field label="Frequência cardíaca" id="heart" type="number" placeholder="72" /><Field label="Peso (kg)" id="weight" type="number" placeholder="70" /><Field label="Altura (cm)" id="height" type="number" placeholder="168" /></div> : <><Field label="Data de nascimento" id="birth" type="date" /><Field label="Telefone" id="phone" type="tel" placeholder="(65) 99999-9999" /><Field label="Contato de emergência" id="emergency" placeholder="Nome e telefone" /></>}<DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">Salvar {isTriage ? "triagem" : "cadastro"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, id, ...props }: { label: string; id: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} required {...props} /></div>;
}