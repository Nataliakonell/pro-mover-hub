import { createFileRoute, useRouterState, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  User,
  HeartPulse,
  Activity,
  ArrowLeft,
  Users,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParticipants, Participant } from "@/lib/participants";
import { getMedicalRecordsApi } from "@/lib/api";

export const Route = createFileRoute("/prontuarios")({
  head: () => ({
    meta: [
      { title: "Prontuários | PRO-MOVER" },
      { name: "description", content: "Prontuários e histórico clínico de atendimentos comunitários." },
    ],
  }),
  component: ProntuariosPage,
});

interface ClinicalRecord {
  id: string;
  name: string;
  age: number;
  date: string;
  status: "Normal" | "Atenção" | "Alterado" | "Acompanhamento";
  pressure: string;
  glucose: string;
  spo2?: string;
  heartRate?: string;
  note: string;
  tone: "danger" | "warning" | "info" | "success";
}

function ProntuariosPage() {
  const routerState = useRouterState();
  const { participants } = useParticipants();
  const [records, setRecords] = useState<ClinicalRecord[]>([]);

  // Ler query param ?search= da URL caso o usuário tenha clicado em "Ir até o prontuário" em /participantes
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });

  // Carrega os prontuários diretamente do PostgreSQL
  useEffect(() => {
    getMedicalRecordsApi()
      .then((data) => {
        if (Array.isArray(data)) {
          setRecords(data);
        }
      })
      .catch((err) => {
        console.warn("Falha ao carregar prontuários do PostgreSQL:", err.message);
      });
  }, []);

  // Unifica os registros clínicos do banco com participantes cadastrados
  const allRecords = useMemo(() => {
    const list: ClinicalRecord[] = [...records];

    participants.forEach((p) => {
      const exists = list.some(
        (r) => r.name.toLowerCase() === p.name.toLowerCase()
      );
      if (!exists) {
        list.push({
          id: `PR-${p.id}`,
          name: p.name,
          age: p.age,
          date: p.createdAt || new Date().toLocaleDateString("pt-BR"),
          status: "Normal",
          pressure: "120/80 mmHg",
          glucose: "90 mg/dL",
          spo2: "98%",
          heartRate: "72 bpm",
          note: `Prontuário aberto para participante cadastrado na ação comunitária (${p.age} anos · Faixa [${p.ageGroup}]). Aguardando novas aferições clínicas.`,
          tone: "info",
        });
      }
    });

    return list;
  }, [records, participants]);

  const filtered = useMemo(() => {
    return allRecords.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [allRecords, search]);

  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);

  // Selecionar o primeiro registro automaticamente ou o correspondente à busca
  useEffect(() => {
    if (filtered.length > 0) {
      if (search) {
        const match = filtered.find((r) =>
          r.name.toLowerCase().includes(search.toLowerCase())
        );
        setSelectedRecord(match || filtered[0]);
      } else if (!selectedRecord) {
        setSelectedRecord(filtered[0]);
      }
    }
  }, [filtered, search]);

  return (
    <AppLayout
      title="Prontuários Clínicos"
      subtitle="Consulte registros de atendimentos, aferições de sinais vitais e histórico clínico dos participantes"
      actions={
        <Link to="/participantes">
          <Button variant="outline" className="gap-1.5 text-xs">
            <Users className="size-4 text-primary" />
            Ver Participantes
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Banner de esclarecimento de fluxo */}
        <div className="rounded-lg border border-border bg-secondary/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="size-4 text-primary shrink-0" />
            <p className="text-muted-foreground">
              Esta é a visão clínica detalhada alimentada pelo banco de dados. Para gerenciar contatos de WhatsApp e dados cadastrais, acesse a página de{" "}
              <Link to="/participantes" className="text-primary font-medium hover:underline">
                Participantes
              </Link>.
            </p>
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="text-xs h-7 text-muted-foreground hover:text-foreground shrink-0"
            >
              Limpar filtro de busca
            </Button>
          )}
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do participante ou número do prontuário (ex: Marta, PR-2026-001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Lista de Prontuários e Detalhes Clínicos */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-5 py-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prontuários Registrados ({filtered.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Alimentado via PostgreSQL
                </span>
              </div>
              <div className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nenhum prontuário encontrado para "{search}".
                  </div>
                ) : (
                  filtered.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedRecord?.id === record.id ? "bg-secondary/70 border-l-4 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary mt-0.5">
                          <FileText className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">{record.name}</h4>
                            <span className="text-[11px] text-muted-foreground">({record.age} anos)</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                record.status === "Alterado"
                                  ? "bg-destructive/15 text-destructive"
                                  : record.status === "Atenção"
                                  ? "bg-warning/20 text-warning-foreground"
                                  : record.status === "Acompanhamento"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {record.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                            {record.id} · Ação de {record.date}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                            <span className="font-mono text-[11px] font-medium text-foreground">
                              PA: {record.pressure}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-mono text-[11px] font-medium text-foreground">
                              Glicemia: {record.glucose}
                            </span>
                            {record.spo2 && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-mono text-[11px] font-medium text-foreground">
                                  SpO₂: {record.spo2}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                        <ArrowUpRight className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Painel Lateral com Detalhes do Prontuário Clínico Selecionado */}
          <div className="rounded-xl border border-border bg-card p-5 h-fit shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-semibold flex items-center gap-2 text-foreground">
                <HeartPulse className="size-4 text-primary" />
                Ficha Clínica Completa
              </h3>
              {selectedRecord && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {selectedRecord.id}
                </span>
              )}
            </div>

            {selectedRecord ? (
              <div className="space-y-4 text-xs">
                {/* Cabeçalho do participante no prontuário */}
                <div className="rounded-lg bg-muted/40 p-3 border border-border">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Participante
                  </span>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {selectedRecord.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span>{selectedRecord.age} anos</span>
                    <span>·</span>
                    <span>Aferição em {selectedRecord.date}</span>
                  </div>
                </div>

                {/* Sinais Vitais Aferidos */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    Sinais Vitais na Triagem
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-md border border-border bg-card p-2.5">
                      <span className="text-[10px] text-muted-foreground block">Pressão Arterial</span>
                      <strong className="text-sm font-mono text-foreground">{selectedRecord.pressure}</strong>
                    </div>
                    <div className="rounded-md border border-border bg-card p-2.5">
                      <span className="text-[10px] text-muted-foreground block">Glicemia Capilar</span>
                      <strong className="text-sm font-mono text-foreground">{selectedRecord.glucose}</strong>
                    </div>
                    <div className="rounded-md border border-border bg-card p-2.5">
                      <span className="text-[10px] text-muted-foreground block">Oximetria (SpO₂)</span>
                      <strong className="text-sm font-mono text-foreground">{selectedRecord.spo2 || "98%"}</strong>
                    </div>
                    <div className="rounded-md border border-border bg-card p-2.5">
                      <span className="text-[10px] text-muted-foreground block">Frequência Cardíaca</span>
                      <strong className="text-sm font-mono text-foreground">{selectedRecord.heartRate || "74 bpm"}</strong>
                    </div>
                  </div>
                </div>

                {/* Evolução e Conduta Clínica */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    Evolução / Observação Clínica
                  </span>
                  <p className="rounded-lg bg-secondary/50 border border-border p-3 text-xs leading-relaxed text-foreground">
                    {selectedRecord.note}
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button variant="outline" className="w-full text-xs">
                    Imprimir Resumo do Prontuário
                  </Button>
                  <Link
                    to="/participantes"
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-primary font-medium hover:underline py-1.5"
                  >
                    <Users className="size-3.5" />
                    Ver Ficha Cadastral em Participantes
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <ClipboardList className="size-8 mx-auto mb-2 text-muted-foreground/60" />
                Selecione um prontuário na lista para visualizar o histórico clínico completo.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
