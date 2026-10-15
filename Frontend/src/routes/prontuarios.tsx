import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  User,
  HeartPulse,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/prontuarios")({
  head: () => ({
    meta: [
      { title: "Prontuários | PRO-MOVER" },
      { name: "description", content: "Prontuários e histórico clínico de atendimentos comunitários." },
    ],
  }),
  component: ProntuariosPage,
});

const mockRecords = [
  {
    id: "PR-2026-001",
    name: "Marta Ferreira",
    age: 58,
    date: "14/10/2026",
    status: "Alterado",
    pressure: "142/90 mmHg",
    glucose: "214 mg/dL",
    note: "Glicemia elevada detectada na triagem. Encaminhada para avaliação médica e suporte com endocrinologista.",
    tone: "danger",
  },
  {
    id: "PR-2026-002",
    name: "Antônio Souza",
    age: 64,
    date: "14/10/2026",
    status: "Atenção",
    pressure: "152/94 mmHg",
    glucose: "110 mg/dL",
    note: "Pressão arterial sistólica elevada. Reavaliação pós-repouso realizada (oximetria 96%).",
    tone: "warning",
  },
  {
    id: "PR-2026-003",
    name: "Rosa Pereira",
    age: 47,
    date: "13/10/2026",
    status: "Acompanhamento",
    pressure: "128/82 mmHg",
    glucose: "95 mg/dL",
    note: "IMC 31,2. Sessão cortesia de avaliação funcional agendada junto à fisioterapia.",
    tone: "info",
  },
  {
    id: "PR-2026-004",
    name: "Carlos Eduardo Mendes",
    age: 39,
    date: "12/10/2026",
    status: "Normal",
    pressure: "118/78 mmHg",
    glucose: "92 mg/dL",
    note: "Sinais vitais normais. Orientações posturais e de ergonomia passadas.",
    tone: "success",
  },
];

function ProntuariosPage() {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<typeof mockRecords[0] | null>(null);

  const filtered = mockRecords.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Prontuários Clínicos"
      subtitle="Consulte registros de atendimentos, triagens e encaminhamentos dos participantes"
    >
      <div className="space-y-6">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do participante ou número do prontuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Lista e Detalhes */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prontuários Registrados ({filtered.length})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedRecord?.id === record.id ? "bg-secondary/70" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary mt-0.5">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">{record.name}</h4>
                          <span className="text-[10px] text-muted-foreground">({record.age} anos)</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {record.id} · Atendimento em {record.date}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <span className="font-mono text-[11px] text-foreground">PA: {record.pressure}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-mono text-[11px] text-foreground">Glicemia: {record.glucose}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel Lateral com Detalhes do Prontuário Selecionado */}
          <div className="rounded-lg border border-border bg-card p-5 h-fit">
            <h3 className="font-display text-base font-medium mb-3 flex items-center gap-2">
              <User className="size-4 text-primary" />
              Detalhes do Prontuário
            </h3>

            {selectedRecord ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Participante</span>
                  <p className="text-sm font-semibold mt-0.5">{selectedRecord.name}</p>
                  <p className="text-muted-foreground">{selectedRecord.age} anos · {selectedRecord.id}</p>
                </div>

                <div className="rounded-md bg-secondary/50 p-3 space-y-1.5 border border-border">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Sinais Vitais</span>
                  <p><strong>Pressão Arterial:</strong> {selectedRecord.pressure}</p>
                  <p><strong>Glicemia Capilar:</strong> {selectedRecord.glucose}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Evolução / Observação Clínica</span>
                  <p className="mt-1 leading-relaxed text-muted-foreground bg-muted/40 p-3 rounded-md">
                    {selectedRecord.note}
                  </p>
                </div>

                <Button variant="outline" className="w-full text-xs">
                  Imprimir Resumo do Prontuário
                </Button>
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
