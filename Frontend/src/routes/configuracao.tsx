import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  HeartPulse,
  Save,
  ShieldAlert,
  Users,
  Info,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useSettings, type AppSettings } from "@/lib/settings";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      { title: "Configurações | PRO-MOVER" },
      { name: "description", content: "Configurações do evento ativo e limites de alertas clínicos demonstrativos." },
    ],
  }),
  component: ConfiguracaoPage,
});

function ConfiguracaoPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [formState, setFormState] = useState<AppSettings>(settings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Acesso restrito: somente perfil 'admin' acessa
  useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/" });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  if (!isAdmin) {
    return (
      <AppLayout title="Acesso Restrito">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="size-12 text-destructive mb-3" />
          <h2 className="text-xl font-semibold">Acesso Restrito a Administradores</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Seu perfil atual ({user.role}) não possui permissão para acessar as configurações do sistema. Redirecionando para o Dashboard...
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleInputChange = (field: keyof AppSettings, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // 4. Salvar configurações convertendo campos numéricos para number
    const updated = updateSettings({
      eventDate: formState.eventDate,
      eventLocation: formState.eventLocation,
      systolicMax: Number(formState.systolicMax),
      diastolicMax: Number(formState.diastolicMax),
      glucoseMax: Number(formState.glucoseMax),
      oxygenMin: Number(formState.oxygenMin),
      heartRateMin: Number(formState.heartRateMin),
      heartRateMax: Number(formState.heartRateMax),
    });

    setFormState(updated);
    setToastMessage("Configurações salvas.");
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const profileDescriptions = [
    {
      title: "Administrador (Admin)",
      badge: "Acesso Total",
      description: "Gerencia parâmetros do evento, edita limites de alertas clínicos, configura o sistema e tem acesso irrestrito a todos os dados.",
    },
    {
      title: "Fisioterapeuta",
      badge: "Clínico",
      description: "Acessa prontuários, registra avaliações funcionais, acompanha casos prioritários e agenda sessões cortesia.",
    },
    {
      title: "Avaliador / Voluntário",
      badge: "Operacional",
      description: "Realiza cadastro ágil de novos participantes e executa a coleta dos sinais vitais nas triagens comunitárias.",
    },
    {
      title: "Recepção",
      badge: "Atendimento",
      description: "Acolhe participantes, organiza a fila de espera do evento e verifica a lista de agendamentos do dia.",
    },
  ];

  return (
    <AppLayout
      title="Configurações do Sistema"
      subtitle="Gerencie o evento ativo, limites clínicos de alerta e visualize regras de permissão"
    >
      <form onSubmit={handleSave} className="space-y-8 max-w-4xl pb-12">
        {/* Bloco 2: Evento comunitário */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium">Evento Comunitário Ativo</h3>
              <p className="text-xs text-muted-foreground">
                Define a data de referência e o local onde os atendimentos e triagens estão sendo realizados.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-xs font-medium">Data do evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={formState.eventDate}
                onChange={(e) => handleInputChange("eventDate", e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Define qual ação de saúde fica selecionada por padrão no app todo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocation" className="text-xs font-medium flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                Local do evento
              </Label>
              <Input
                id="eventLocation"
                type="text"
                placeholder="Ex: Farmácia Popular Santa Luzia"
                value={formState.eventLocation}
                onChange={(e) => handleInputChange("eventLocation", e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Nome do posto de atendimento, farmácia ou espaço comunitário parceiro.
              </p>
            </div>
          </div>
        </section>

        {/* Bloco 3: Parâmetros demonstrativos de alerta */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <span className="grid size-9 place-items-center rounded-md bg-warning/10 text-warning-foreground">
              <HeartPulse className="size-5 text-warning" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium">Parâmetros Demonstrativos de Alerta</h3>
              <p className="text-xs text-muted-foreground">
                Valores de corte que acionam avisos visuais de risco durante a triagem de sinais vitais.
              </p>
            </div>
          </div>

          {/* Aviso Amarelo */}
          <div className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-4 text-xs text-warning-foreground">
            <div className="flex gap-3">
              <AlertTriangle className="size-5 shrink-0 text-warning" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Atenção: Parâmetros clínicos não validados</p>
                <p className="leading-relaxed">
                  Estes valores são estritamente demonstrativos para uso em adultos saudáveis e <strong>não constituem um protocolo clínico validado</strong>. A equipe técnica e médica responsável pelo projeto deve revisar e homologar esses limites antes de qualquer aplicação em ambiente real.
                </p>
              </div>
            </div>
          </div>

          {/* Grid dos 6 campos numéricos */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="systolicMax" className="text-xs font-medium">Sistólica alterada a partir de (mmHg)</Label>
              <Input
                id="systolicMax"
                type="number"
                min="50"
                max="250"
                value={formState.systolicMax}
                onChange={(e) => handleInputChange("systolicMax", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 140 mmHg</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diastolicMax" className="text-xs font-medium">Diastólica alterada a partir de (mmHg)</Label>
              <Input
                id="diastolicMax"
                type="number"
                min="30"
                max="150"
                value={formState.diastolicMax}
                onChange={(e) => handleInputChange("diastolicMax", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 90 mmHg</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="glucoseMax" className="text-xs font-medium">Glicemia alterada a partir de (mg/dL)</Label>
              <Input
                id="glucoseMax"
                type="number"
                min="40"
                max="500"
                value={formState.glucoseMax}
                onChange={(e) => handleInputChange("glucoseMax", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 180 mg/dL</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oxygenMin" className="text-xs font-medium">SpO₂ alterada abaixo de (%)</Label>
              <Input
                id="oxygenMin"
                type="number"
                min="50"
                max="100"
                value={formState.oxygenMin}
                onChange={(e) => handleInputChange("oxygenMin", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 95%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartRateMin" className="text-xs font-medium">Frequência cardíaca mínima (bpm)</Label>
              <Input
                id="heartRateMin"
                type="number"
                min="30"
                max="120"
                value={formState.heartRateMin}
                onChange={(e) => handleInputChange("heartRateMin", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 50 bpm (bradicardia)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartRateMax" className="text-xs font-medium">Frequência cardíaca máxima (bpm)</Label>
              <Input
                id="heartRateMax"
                type="number"
                min="80"
                max="220"
                value={formState.heartRateMax}
                onChange={(e) => handleInputChange("heartRateMax", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Padrão sugerido: 100 bpm (taquicardia)</p>
            </div>
          </div>

          {/* Nota com regras complementares fixas */}
          <div className="mt-6 rounded-md bg-secondary/50 p-4 border border-border">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
              <Info className="size-4 text-primary" />
              Regras complementares já fixas no código:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
              <li><strong>Hipotensão (pressão baixa):</strong> Sistólica &lt; 90 mmHg ou Diastólica &lt; 60 mmHg.</li>
              <li><strong>Hipoglicemia severa:</strong> Glicemia &lt; 70 mg/dL.</li>
              <li><strong>Classificação do IMC:</strong> Baixo peso (&lt; 18,5), Eutrófico (18,5 – 24,9), Sobrepeso (25,0 – 29,9) e Obesidade (≥ 30,0).</li>
              <li><strong>Faixas de atenção:</strong> Variações limítrofes acionam sinalização visual de alerta intermediário antes do encaminhamento prioritário.</li>
            </ul>
          </div>
        </section>

        {/* Bloco 4: Botão Salvar configurações */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            As alterações são salvas localmente no navegador e persistidas neste dispositivo.
          </p>
          <Button type="submit" className="gap-2 px-6">
            <Save className="size-4" />
            Salvar configurações
          </Button>
        </div>

        {/* Bloco 5: Perfis e acesso nesta interface */}
        <section className="rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <Users className="size-5 text-primary" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium">Perfis e Acesso nesta Interface</h3>
              <p className="text-xs text-muted-foreground">
                Painel informativo dos níveis de privilégio e escopo de cada função no PRO-MOVER Hub.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {profileDescriptions.map((item) => (
              <div key={item.title} className="rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Aviso Importante de Fechamento */}
          <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
            <p className="font-semibold text-xs flex items-center gap-2 mb-1">
              <ShieldAlert className="size-4 text-primary" />
              Aviso Importante sobre Segurança e Controle de Acesso
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Esta versão controla o fluxo de navegação e a experiência de uso da interface, <strong>não configurando uma camada de segurança de dados definitiva</strong>. Para uso clínico e corporativo real, é mandatória a integração com autenticação via backend, tokens criptografados e controle de permissões centralizado (RBAC).
            </p>
          </div>
        </section>
      </form>

      {/* Notificação Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg transition-all"
        >
          <CheckCircle2 className="size-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
