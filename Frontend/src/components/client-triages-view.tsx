import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Activity,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Scale,
  RefreshCw,
  LogOut,
  Stethoscope,
  Info,
  Building2,
  CalendarDays,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { getTriagesApi } from "@/lib/api";
import { TriageRecord } from "@/lib/triages";

export function ClientTriagesView() {
  const { user, logout } = useAuth();
  const [triages, setTriages] = useState<TriageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getTriagesApi();
      if (Array.isArray(data)) {
        setTriages(data);
      }
    } catch (err) {
      console.error("Erro ao carregar triagens do participante:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Normal":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="size-3.5" />
            Normal
          </span>
        );
      case "Atenção":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertTriangle className="size-3.5" />
            Atenção
          </span>
        );
      case "Alterado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="size-3.5" />
            Alterado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <AppLayout
      title="Minhas Triagens Clínicas"
      subtitle="Acompanhamento e histórico dos seus exames de saúde e sinais vitais"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar Dados
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Banner com informações do Participante */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-card to-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="size-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{user?.name || "Participante"}</h2>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary border-primary/30">
                  Participante
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Login via CPF: <span className="font-mono font-medium text-foreground">{user?.username || "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-muted-foreground block">Total de Triagens</span>
              <span className="text-lg font-bold text-foreground font-mono">{triages.length}</span>
            </div>
          </div>
        </div>

        {/* Lista de Triagens ou Empty State */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
            <RefreshCw className="size-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-semibold text-foreground">Carregando suas triagens...</p>
            <p className="text-xs text-muted-foreground">Buscando histórico médico no banco de dados.</p>
          </div>
        ) : triages.length === 0 ? (
          /* Empty State Limpo */
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <HeartPulse className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Nenhuma triagem registrada ainda</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Assim que a equipe da farmácia realizar a sua triagem clínica (pressão arterial, oxigenação, frequência e IMC), ela aparecerá aqui para você consultar.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Histórico de Triagens Realizadas ({triages.length})
              </h3>
              <span className="text-xs text-muted-foreground">Exibição somente leitura</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {triages.map((triage) => (
                <div
                  key={triage.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
                >
                  {/* Cabeçalho da Triagem */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-foreground">
                            {triage.id}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                            <CalendarDays className="size-3.5 text-primary" />
                            {triage.date || (triage.createdAt ? new Date(triage.createdAt).toLocaleDateString("pt-BR") : "Data não informada")}
                          </span>
                          {triage.time && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {triage.time}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Metadados: Campanha e Farmácia */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                          {triage.eventName && (
                            <span className="inline-flex items-center gap-1 text-foreground font-medium">
                              <Calendar className="size-3.5 text-primary shrink-0" />
                              Campanha: {triage.eventName}
                            </span>
                          )}
                          {triage.pharmacyName && (
                            <span className="inline-flex items-center gap-1 text-foreground font-medium">
                              <Building2 className="size-3.5 text-emerald-600 shrink-0" />
                              Farmácia: {triage.pharmacyName}
                            </span>
                          )}
                          <span>
                            Responsável: <strong className="text-foreground font-normal">{triage.responsible || "Equipe Conecta Saúde"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="self-start sm:self-center shrink-0">
                      {getStatusBadge(triage.status)}
                    </div>
                  </div>

                  {/* Cartões de Sinais Vitais */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Pressão Arterial */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">Pressão Arterial</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono text-foreground">
                          {triage.systolic}/{triage.diastolic}
                        </span>
                        <span className="text-[10px] text-muted-foreground">mmHg</span>
                      </div>
                    </div>

                    {/* Saturação de O2 */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">SpO₂ (Oxigenação)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono text-foreground">
                          {triage.spo2}
                        </span>
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Frequência Cardíaca */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">Freq. Cardíaca</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono text-foreground">
                          {triage.heartRate}
                        </span>
                        <span className="text-[10px] text-muted-foreground">bpm</span>
                      </div>
                    </div>

                    {/* Situação */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">Diagnóstico</span>
                      <span className="text-sm font-bold text-foreground block truncate">
                        {triage.status}
                      </span>
                    </div>
                  </div>

                  {/* Resumo / Laudo Clínico */}
                  {triage.result && (
                    <div className="p-3.5 rounded-xl border border-border/70 bg-accent/20 text-xs text-foreground space-y-1">
                      <span className="font-semibold text-muted-foreground block">Laudo e Observações:</span>
                      <p className="leading-relaxed">{triage.result}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
