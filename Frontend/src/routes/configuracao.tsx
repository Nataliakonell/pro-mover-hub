import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {AlertTriangle, HeartPulse, Save, ShieldAlert, Info, CheckCircle2, Activity, Scale } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useSettings, type AppSettings } from "@/lib/settings";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      { title: "Configurações | Conecta Saúde" },
      { name: "description", content: "Configurações clínicas, limites de alertas e parâmetros de IMC do Conecta Saúde." },
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

  // Acesso restrito: somente perfil 'admin' acessa
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

    const updated = updateSettings({
      eventDate: formState.eventDate,
      eventLocation: formState.eventLocation,
      systolicMin: Number(formState.systolicMin),
      systolicMax: Number(formState.systolicMax),
      diastolicMin: Number(formState.diastolicMin),
      diastolicMax: Number(formState.diastolicMax),
      glucoseMax: Number(formState.glucoseMax),
      oxygenMin: Number(formState.oxygenMin),
      heartRateMin: Number(formState.heartRateMin),
      heartRateMax: Number(formState.heartRateMax),

      imcUnderweightMax: Number(formState.imcUnderweightMax),
      imcNormalMax: Number(formState.imcNormalMax),
      imcOverweightMax: Number(formState.imcOverweightMax),
      imcObesity1Max: Number(formState.imcObesity1Max),
      imcObesity2Max: Number(formState.imcObesity2Max),
    });

    setFormState(updated);
    setToastMessage("Configurações clínicas e parâmetros de IMC salvos com sucesso.");
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <AppLayout
      title="Configurações Clínicas"
      subtitle="Defina os parâmetros de IMC e limites demonstrativos para detecção de alterações nas triagens"
    >
      <form onSubmit={handleSave} className="space-y-8 max-w-4xl pb-12">
        {/* Bloco 2: Parâmetros demonstrativos de alerta de sinais vitais */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-warning/10 text-warning-foreground">
              <HeartPulse className="size-5.5 text-warning" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl text-foreground">
                Parâmetros Demonstrativos de Alerta de Sinais Vitais
              </h3>
              <p className="text-sm text-muted-foreground">
                Valores de corte que acionam avisos visuais de risco durante a triagem.
              </p>
            </div>
          </div>

          {/* Aviso Amarelo */}
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
            <div className="flex gap-3">
              <AlertTriangle className="size-5 shrink-0 text-warning" />
              <div className="space-y-1">
                <p className="font-bold text-base">Atenção: Parâmetros clínicos não validados</p>
                <p className="leading-relaxed text-xs sm:text-sm">
                  Estes valores são estritamente demonstrativos para uso em adultos saudáveis e <strong>não constituem um protocolo clínico definitivo</strong>. A equipe técnica e médica deve revisar e homologar esses limites antes de qualquer aplicação em ambiente hospitalar.
                </p>
              </div>
            </div>
          </div>

          {/* Faixas de Pressão Arterial */}
          <div className="mb-6 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
            <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
              <HeartPulse className="size-4.5 text-primary" />
              Faixas de Referência para Pressão Arterial (mmHg)
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
              Medições <strong>abaixo do mínimo</strong> (hipotensão) ou <strong>acima do máximo</strong> (hipertensão) serão sinalizadas como <strong>Alteradas</strong>.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <span className="text-sm font-semibold text-foreground block">Pressão Sistólica (máxima)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="systolicMin" className="text-xs font-medium text-foreground">Mínima (mmHg)</Label>
                    <Input
                      id="systolicMin"
                      type="number"
                      min="50"
                      max="150"
                      className="h-10 text-sm font-semibold"
                      value={formState.systolicMin}
                      onChange={(e) => handleInputChange("systolicMin", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Padrão: 90 mmHg</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="systolicMax" className="text-xs font-medium text-foreground">Máxima (mmHg)</Label>
                    <Input
                      id="systolicMax"
                      type="number"
                      min="100"
                      max="250"
                      className="h-10 text-sm font-semibold"
                      value={formState.systolicMax}
                      onChange={(e) => handleInputChange("systolicMax", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Padrão: 140 mmHg</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
                <span className="text-sm font-semibold text-foreground block">Pressão Diastólica (mínima)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="diastolicMin" className="text-xs font-medium text-foreground">Mínima (mmHg)</Label>
                    <Input
                      id="diastolicMin"
                      type="number"
                      min="30"
                      max="100"
                      className="h-10 text-sm font-semibold"
                      value={formState.diastolicMin}
                      onChange={(e) => handleInputChange("diastolicMin", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Padrão: 60 mmHg</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="diastolicMax" className="text-xs font-medium text-foreground">Máxima (mmHg)</Label>
                    <Input
                      id="diastolicMax"
                      type="number"
                      min="60"
                      max="150"
                      className="h-10 text-sm font-semibold"
                      value={formState.diastolicMax}
                      onChange={(e) => handleInputChange("diastolicMax", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Padrão: 90 mmHg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glicemia, Oxigenação e Frequência Cardíaca */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
            <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Activity className="size-4.5 text-primary" />
              Glicemia, Oxigenação e Frequência Cardíaca
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
              Pontos de corte para detecção de hiperglicemia, saturação de oxigênio insuficiente (hipoxemia) e alterações do ritmo cardíaco.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Metabolismo e Oxigenação */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-xs">
                <span className="text-sm font-semibold text-foreground block">
                  Metabolismo e Oxigenação
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="glucoseMax" className="text-xs font-medium text-foreground block">
                      Glicemia máxima
                    </Label>
                    <div className="relative">
                      <Input
                        id="glucoseMax"
                        type="number"
                        min="40"
                        max="500"
                        className="h-10 text-sm font-semibold pr-12"
                        value={formState.glucoseMax}
                        onChange={(e) => handleInputChange("glucoseMax", e.target.value)}
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-mono pointer-events-none">
                        mg/dL
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">Padrão: 140 mg/dL</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="oxygenMin" className="text-xs font-medium text-foreground block">
                      SpO₂ mínima
                    </Label>
                    <div className="relative">
                      <Input
                        id="oxygenMin"
                        type="number"
                        min="50"
                        max="100"
                        className="h-10 text-sm font-semibold pr-7"
                        value={formState.oxygenMin}
                        onChange={(e) => handleInputChange("oxygenMin", e.target.value)}
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-mono pointer-events-none">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">Padrão: 95%</p>
                  </div>
                </div>
              </div>

              {/* Frequência Cardíaca */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-xs">
                <span className="text-sm font-semibold text-foreground block">
                  Frequência Cardíaca (Ritmo)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="heartRateMin" className="text-xs font-medium text-foreground block">
                      Frequência mínima
                    </Label>
                    <div className="relative">
                      <Input
                        id="heartRateMin"
                        type="number"
                        min="30"
                        max="120"
                        className="h-10 text-sm font-semibold pr-10"
                        value={formState.heartRateMin}
                        onChange={(e) => handleInputChange("heartRateMin", e.target.value)}
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-mono pointer-events-none">
                        bpm
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">Padrão: 50 bpm (bradicardia)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="heartRateMax" className="text-xs font-medium text-foreground block">
                      Frequência máxima
                    </Label>
                    <div className="relative">
                      <Input
                        id="heartRateMax"
                        type="number"
                        min="80"
                        max="220"
                        className="h-10 text-sm font-semibold pr-10"
                        value={formState.heartRateMax}
                        onChange={(e) => handleInputChange("heartRateMax", e.target.value)}
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-mono pointer-events-none">
                        bpm
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">Padrão: 100 bpm (taquicardia)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bloco 1: Parâmetros de Classificação do IMC */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Scale className="size-5.5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl text-foreground">
                Parâmetros de Classificação do IMC (Índice de Massa Corporal)
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure os pontos de corte (kg/m²) utilizados no cálculo automático do IMC durante a triagem.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Abaixo do peso */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imcUnderweightMax" className="text-sm font-semibold text-foreground">
                  Abaixo do peso
                </Label>
                <span className="rounded-full bg-amber-500/15 text-amber-600 px-2.5 py-0.5 text-xs font-bold">
                  Atenção
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Classificado para valores abaixo de:</p>
              <div className="relative">
                <Input
                  id="imcUnderweightMax"
                  type="number"
                  step="0.1"
                  min="10"
                  max="25"
                  className="h-10 text-sm font-semibold pr-14"
                  value={formState.imcUnderweightMax}
                  onChange={(e) => handleInputChange("imcUnderweightMax", e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Padrão OMS: &lt; 18,5 kg/m²</p>
            </div>

            {/* 2. Peso normal */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imcNormalMax" className="text-sm font-semibold text-foreground">
                  Peso normal (Eutrófico)
                </Label>
                <span className="rounded-full bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-bold">
                  Normal
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Faixa ideal até o limite de:</p>
              <div className="relative">
                <Input
                  id="imcNormalMax"
                  type="number"
                  step="0.1"
                  min="18"
                  max="30"
                  className="h-10 text-sm font-semibold pr-14"
                  value={formState.imcNormalMax}
                  onChange={(e) => handleInputChange("imcNormalMax", e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Padrão OMS: 18,5 a 24,9 kg/m²</p>
            </div>

            {/* 3. Sobrepeso */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imcOverweightMax" className="text-sm font-semibold text-foreground">
                  Sobrepeso
                </Label>
                <span className="rounded-full bg-amber-500/15 text-amber-600 px-2.5 py-0.5 text-xs font-bold">
                  Atenção
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Faixa de sobrepeso até:</p>
              <div className="relative">
                <Input
                  id="imcOverweightMax"
                  type="number"
                  step="0.1"
                  min="24"
                  max="35"
                  className="h-10 text-sm font-semibold pr-14"
                  value={formState.imcOverweightMax}
                  onChange={(e) => handleInputChange("imcOverweightMax", e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Padrão OMS: 25,0 a 29,9 kg/m²</p>
            </div>

            {/* 4. Obesidade Grau 1 */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imcObesity1Max" className="text-sm font-semibold text-foreground">
                  Obesidade Grau 1
                </Label>
                <span className="rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-bold">
                  Alterado
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Grau leve (moderado) até:</p>
              <div className="relative">
                <Input
                  id="imcObesity1Max"
                  type="number"
                  step="0.1"
                  min="29"
                  max="40"
                  className="h-10 text-sm font-semibold pr-14"
                  value={formState.imcObesity1Max}
                  onChange={(e) => handleInputChange("imcObesity1Max", e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Padrão OMS: 30,0 a 34,9 kg/m²</p>
            </div>

            {/* 5. Obesidade Grau 2 */}
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imcObesity2Max" className="text-sm font-semibold text-foreground">
                  Obesidade Grau 2
                </Label>
                <span className="rounded-full bg-destructive/20 text-destructive px-2.5 py-0.5 text-xs font-bold">
                  Alterado
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Grau severo até:</p>
              <div className="relative">
                <Input
                  id="imcObesity2Max"
                  type="number"
                  step="0.1"
                  min="34"
                  max="50"
                  className="h-10 text-sm font-semibold pr-14"
                  value={formState.imcObesity2Max}
                  onChange={(e) => handleInputChange("imcObesity2Max", e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Padrão OMS: 35,0 a 39,9 kg/m²</p>
            </div>

            {/* 6. Obesidade Grau 3 */}
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Obesidade Grau 3 (Grave)
                </span>
                <span className="rounded-full bg-destructive text-destructive-foreground px-2.5 py-0.5 text-xs font-bold">
                  Crítico
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Classificado automaticamente:</p>
              <div className="h-10 flex items-center px-3 rounded-lg border border-border bg-background text-sm font-bold font-mono text-destructive">
                ≥ {Number(formState.imcObesity2Max) + 0.1 || "40.0"} kg/m²
              </div>
              <p className="text-[11px] text-muted-foreground">Acima do teto de Obesidade Grau 2</p>
            </div>
          </div>
        </section>
        {/* Botão Salvar configurações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            As alterações são salvas e persistidas no sistema para todas as triagens.
          </p>
          <Button type="submit" className="gap-2 px-6 h-11 text-sm font-semibold shadow-sm">
            <Save className="size-4.5" />
            Salvar configurações
          </Button>
        </div>
      </form>

      {/* Notificação Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-foreground px-5 py-3.5 text-sm font-semibold text-background shadow-xl transition-all"
        >
          <CheckCircle2 className="size-5 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
