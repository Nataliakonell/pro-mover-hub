import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  HeartPulse,
  Users,
  Settings,
  Search,
  Plus,
  Phone,
  MapPin,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
  Sparkles,
  ArrowUpRight,
  Activity,
  Calendar,
  BadgeCheck,
  ExternalLink,
  Edit3,
  Trash2,
  Scale,
  Save,
  MessageCircle,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { usePharmacies, formatCNPJ, type LinkedPharmacy } from "@/lib/pharmacies";
import {
  useDashboardEvents,
  createDashboardCampaign,
  type DashboardEvent,
  formatCampaignPeriod,
} from "@/lib/dashboard-data";
import {
  useParticipants,
  formatCPF,
  formatPhone,
  cleanPhoneForWhatsApp,
  type Participant,
} from "@/lib/participants";
import { useSettings, type AppSettings } from "@/lib/settings";

export const Route = createFileRoute("/administrador")({
  head: () => ({
    meta: [
      { title: "Painel do Administrador | Conecta Saúde" },
      {
        name: "description",
        content:
          "Visualização e gestão de farmácias vinculadas, campanhas, participantes do sistema e configurações clínicas.",
      },
    ],
  }),
  component: AdministradorPage,
});

function AdministradorPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Dados das 4 áreas solicitadas
  const { pharmacies, addPharmacy, updatePharmacy, removePharmacy } = usePharmacies();
  const { events, refreshEvents } = useDashboardEvents();
  const { participants } = useParticipants();
  const { settings, updateSettings } = useSettings();

  // Controle de Abas
  const [activeTab, setActiveTab] = useState<string>("visao-geral");

  // Notificações Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------
  // 1. Estados e Filtros para FARMÁCIAS VINCULADAS
  // ---------------------------------------------------------
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState<string>("ALL");
  const [isAddPharmacyOpen, setIsAddPharmacyOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<LinkedPharmacy | null>(null);

  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    responsible: "",
    crf: "",
    address: "",
    neighborhood: "",
    city: "Cuiabá - MT",
    status: "Ativa" as "Ativa" | "Inativa" | "Pendente",
    notes: "",
  });

  const resetPharmacyForm = () => {
    setPharmacyForm({
      name: "",
      cnpj: "",
      phone: "",
      email: "",
      responsible: "",
      crf: "",
      address: "",
      neighborhood: "",
      city: "Cuiabá - MT",
      status: "Ativa",
      notes: "",
    });
    setEditingPharmacy(null);
  };

  const handleOpenEditPharmacy = (pharmacy: LinkedPharmacy) => {
    setEditingPharmacy(pharmacy);
    setPharmacyForm({
      name: pharmacy.name,
      cnpj: pharmacy.cnpj,
      phone: pharmacy.phone,
      email: pharmacy.email || "",
      responsible: pharmacy.responsible,
      crf: pharmacy.crf || "",
      address: pharmacy.address,
      neighborhood: pharmacy.neighborhood,
      city: pharmacy.city,
      status: pharmacy.status,
      notes: pharmacy.notes || "",
    });
    setIsAddPharmacyOpen(true);
  };

  const handleSavePharmacy = async (e: FormEvent) => {
    e.preventDefault();
    if (!pharmacyForm.name.trim()) return;

    try {
      if (editingPharmacy) {
        await updatePharmacy(editingPharmacy.id, {
          ...pharmacyForm,
          cnpj: formatCNPJ(pharmacyForm.cnpj),
        });
        showToast(`Farmácia "${pharmacyForm.name}" atualizada no banco de dados com sucesso!`);
      } else {
        await addPharmacy({
          ...pharmacyForm,
          cnpj: formatCNPJ(pharmacyForm.cnpj),
        });
        showToast(`Farmácia "${pharmacyForm.name}" vinculada e salva no banco de dados!`);
      }

      setIsAddPharmacyOpen(false);
      resetPharmacyForm();
    } catch (err: any) {
      showToast(`Erro ao salvar farmácia: ${err.message}`);
    }
  };

  const handleDeletePharmacy = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente desvincular a farmácia "${name}" do banco de dados?`)) {
      try {
        await removePharmacy(id);
        showToast(`Farmácia "${name}" removida do banco de dados.`);
      } catch (err: any) {
        showToast(`Erro ao remover farmácia: ${err.message}`);
      }
    }
  };

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(pharmacySearch.toLowerCase()) ||
        p.cnpj.includes(pharmacySearch) ||
        p.neighborhood.toLowerCase().includes(pharmacySearch.toLowerCase()) ||
        p.responsible.toLowerCase().includes(pharmacySearch.toLowerCase());

      const matchesStatus =
        pharmacyStatusFilter === "ALL" || p.status === pharmacyStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pharmacies, pharmacySearch, pharmacyStatusFilter]);

  // ---------------------------------------------------------
  // 2. Estados e Filtros para CAMPANHAS DAS FARMÁCIAS
  // ---------------------------------------------------------
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignPharmacyFilter, setCampaignPharmacyFilter] = useState<string>("ALL");
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    pharmacyId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    location: "",
  });

  // Mapeia campanhas às suas farmácias reais do banco de dados
  const campaignsWithPharmacy = useMemo(() => {
    return events.map((ev) => {
      const assignedPharmacy = ev.pharmacy || pharmacies.find((p) => p.id === ev.pharmacyId) || null;
      return {
        ...ev,
        pharmacy: assignedPharmacy,
      };
    });
  }, [events, pharmacies]);

  const filteredCampaigns = useMemo(() => {
    return campaignsWithPharmacy.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
        c.location.toLowerCase().includes(campaignSearch.toLowerCase()) ||
        (c.pharmacy?.name || "").toLowerCase().includes(campaignSearch.toLowerCase());

      const matchesPharmacy =
        campaignPharmacyFilter === "ALL" ||
        c.pharmacy?.id === campaignPharmacyFilter;

      return matchesSearch && matchesPharmacy;
    });
  }, [campaignsWithPharmacy, campaignSearch, campaignPharmacyFilter]);

  const handleSaveCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;

    const selectedPharm = pharmacies.find((p) => p.id === campaignForm.pharmacyId);
    const locationFinal =
      campaignForm.location.trim() ||
      (selectedPharm ? `${selectedPharm.name} - ${selectedPharm.address}, ${selectedPharm.neighborhood}` : "Polo Comunitário de Saúde");

    try {
      await createDashboardCampaign({
        name: campaignForm.name.trim(),
        startDate: campaignForm.startDate,
        endDate: campaignForm.endDate,
        location: locationFinal,
        pharmacyId: campaignForm.pharmacyId || undefined,
      });

      await refreshEvents();
      setIsAddCampaignOpen(false);
      setCampaignForm({
        name: "",
        pharmacyId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        location: "",
      });
      showToast(`Campanha salva com sucesso no banco de dados!`);
    } catch (err: any) {
      showToast(`Erro ao salvar campanha: ${err.message}`);
    }
  };

  // ---------------------------------------------------------
  // 3. Estados e Filtros para PARTICIPANTES DO SISTEMA
  // ---------------------------------------------------------
  const [participantSearch, setParticipantSearch] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("ALL");

  const filteredParticipants = useMemo(() => {
    return participants.filter((part) => {
      const matchesSearch =
        part.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
        part.cpf.replace(/\D/g, "").includes(participantSearch.replace(/\D/g, "")) ||
        part.phone.replace(/\D/g, "").includes(participantSearch.replace(/\D/g, ""));

      const matchesAge =
        ageGroupFilter === "ALL" || part.ageGroup === ageGroupFilter;

      return matchesSearch && matchesAge;
    });
  }, [participants, participantSearch, ageGroupFilter]);

  // ---------------------------------------------------------
  // 4. Estados para CONFIGURAÇÕES DO SISTEMA
  // ---------------------------------------------------------
  const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleSettingsChange = (field: keyof AppSettings, value: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    const updated = updateSettings({
      eventDate: settingsForm.eventDate,
      eventLocation: settingsForm.eventLocation,
      systolicMin: Number(settingsForm.systolicMin),
      systolicMax: Number(settingsForm.systolicMax),
      diastolicMin: Number(settingsForm.diastolicMin),
      diastolicMax: Number(settingsForm.diastolicMax),
      oxygenMin: Number(settingsForm.oxygenMin),
      oxygenMax: Number(settingsForm.oxygenMax),
      heartRateMin: Number(settingsForm.heartRateMin),
      heartRateMax: Number(settingsForm.heartRateMax),

      imcUnderweightMax: Number(settingsForm.imcUnderweightMax),
      imcNormalMax: Number(settingsForm.imcNormalMax),
      imcOverweightMax: Number(settingsForm.imcOverweightMax),
      imcObesity1Max: Number(settingsForm.imcObesity1Max),
      imcObesity2Max: Number(settingsForm.imcObesity2Max),
    });

    setSettingsForm(updated);
    showToast("Configurações do sistema atualizadas e gravadas com sucesso!");
  };

  // ---------------------------------------------------------
  // Métricas para os Cards de Topo
  // ---------------------------------------------------------
  const activePharmaciesCount = pharmacies.filter((p) => p.status === "Ativa").length;
  const totalCampaignsCount = events.length;
  const totalParticipantsCount = participants.length;
  const totalTriagesDone = events.reduce(
    (acc, curr) => acc + (curr.metrics?.triagesDone || 0),
    0
  );

  // Bloqueio de acesso para quem não é Administrador
  // Executado estritamente APÓS todos os hooks para não violar as Regras de Hooks do React
  if (!isAdmin) {
    return (
      <AppLayout title="Acesso Restrito">
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito ao Administrador</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Esta área é exclusiva para usuários com perfil de Administrador. Para acessar as farmácias vinculadas, campanhas e configurações, faça login com a conta de admin cadastrada no banco de dados.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full text-xs font-semibold"
            >
              Fazer Login como Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/" })}
              className="w-full text-xs font-semibold"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={
        <div className="flex items-center gap-2.5">
          <span>Painel do Administrador</span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
            <ShieldCheck className="size-3.5 mr-1" />
            Admin Global
          </Badge>
        </div>
      }
      subtitle="Supervisão centralizada de farmácias credenciadas, campanhas, participantes e parâmetros operacionais"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              resetPharmacyForm();
              setIsAddPharmacyOpen(true);
            }}
            className="gap-1.5 text-xs font-semibold"
          >
            <Building2 className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Vincular</span> Farmácia
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddCampaignOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Nova</span> Campanha
          </Button>
        </div>
      }
    >
      {/* Toast Alert Flutuante */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="size-4.5 text-success shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cards de Métricas Principais (KPIs) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-8">
        {/* Card 1: Farmácias */}
        <div
          onClick={() => setActiveTab("farmacias")}
          className="group cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Farmácias Vinculadas</span>
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Building2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {pharmacies.length}
            </span>
            <span className="text-xs font-medium text-success">
              {activePharmaciesCount} ativas
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Polos de saúde e triagem cadastrados
          </p>
        </div>

        {/* Card 2: Campanhas */}
        <div
          onClick={() => setActiveTab("campanhas")}
          className="group cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Campanhas Criadas</span>
            <div className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <HeartPulse className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalCampaignsCount}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              ações comunitárias
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Promoções de saúde realizadas
          </p>
        </div>

        {/* Card 3: Participantes */}
        <div
          onClick={() => setActiveTab("participantes")}
          className="group cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Participantes no Sistema</span>
            <div className="grid size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalParticipantsCount}
            </span>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              cadastrados
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Total de cidadãos assistidos
          </p>
        </div>

        {/* Card 4: Configurações & Status */}
        <div
          onClick={() => setActiveTab("configuracoes")}
          className="group cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Configurações</span>
            <div className="grid size-9 place-items-center rounded-lg bg-success/10 text-success group-hover:scale-105 transition-transform">
              <Settings className="size-4.5 text-success" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              100% Ativo
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Limites clínicos e parâmetros de IMC
          </p>
        </div>
      </section>

      {/* Tabs Principais com os 4 Pilares */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/60 rounded-xl gap-1">
          <TabsTrigger value="visao-geral" className="py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Activity className="size-4 mr-1.5 text-primary" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="farmacias" className="py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Building2 className="size-4 mr-1.5 text-primary" />
            Farmácias ({pharmacies.length})
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <HeartPulse className="size-4 mr-1.5 text-amber-600 dark:text-amber-400" />
            Campanhas ({events.length})
          </TabsTrigger>
          <TabsTrigger value="participantes" className="py-2.5 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Users className="size-4 mr-1.5 text-sky-600 dark:text-sky-400" />
            Participantes ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="py-2.5 text-xs sm:text-sm font-semibold rounded-lg col-span-2 md:col-span-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Settings className="size-4 mr-1.5 text-success" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* ABA 0: VISÃO GERAL */}
        {/* ========================================================= */}
        <TabsContent value="visao-geral" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bloco Esquerda: Resumo de Farmácias e Ações */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">Farmácias Parceiras em Destaque</h3>
                      <p className="text-xs text-muted-foreground">Polos de atendimento comunitário vinculados ao PRO-MOVER Hub</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("farmacias")}
                    className="text-xs text-primary gap-1"
                  >
                    Ver todas
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pharmacies.slice(0, 4).map((pharm) => (
                    <div
                      key={pharm.id}
                      className="p-4 rounded-xl border border-border/80 bg-background hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-foreground line-clamp-1">{pharm.name}</h4>
                          <Badge
                            variant="secondary"
                            className={
                              pharm.status === "Ativa"
                                ? "bg-success/15 text-success border-success/30 text-[10px]"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]"
                            }
                          >
                            {pharm.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <MapPin className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{pharm.neighborhood}, {pharm.city}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="size-3 shrink-0 text-muted-foreground" />
                          <span>{pharm.phone}</span>
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="text-[11px]">Resp: <strong className="text-foreground font-medium">{pharm.responsible.split(" ")[0]}</strong></span>
                        <span className="text-[11px] font-mono">{pharm.cnpj}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco de Campanhas Recentes */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <HeartPulse className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">Últimas Campanhas Comunitárias</h3>
                      <p className="text-xs text-muted-foreground">Ações de saúde ativas ou concluídas pelas farmácias</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("campanhas")}
                    className="text-xs text-primary gap-1"
                  >
                    Ver todas
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {campaignsWithPharmacy.slice(0, 3).map((camp) => (
                    <div
                      key={camp.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground">{camp.name}</h4>
                          {camp.pharmacy && (
                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                              {camp.pharmacy.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" />
                            {camp.date || formatCampaignPeriod(camp.startDate, camp.endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span className="truncate max-w-[220px]">{camp.location}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/"
                          search={{ campanha: camp.id }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2.5 py-1.5 rounded-lg bg-primary/10 transition-colors"
                        >
                          Ver no Dashboard
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bloco Direita: Participantes Recentes & Acesso Rápido */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-4.5 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-semibold text-sm text-foreground">Participantes no Sistema</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("participantes")}
                    className="text-xs text-primary"
                  >
                    Ver ({participants.length})
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Relação de cidadãos com cadastro ativo no ecossistema e histórico de triagens:
                </p>

                <div className="space-y-2.5">
                  {participants.slice(0, 5).map((part) => (
                    <div
                      key={part.id}
                      className="p-3 rounded-lg border border-border/70 bg-background/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{part.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{part.cpf}</span>
                          <span>•</span>
                          <span>{part.age} anos ({part.ageGroup})</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {part.attendances?.length || 0} presenças
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <Link
                    to="/participantes"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors"
                  >
                    Diretório Completo de Participantes
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card de Configurações do Sistema */}
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-success/10 text-success">
                    <Settings className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Parâmetros do Sistema</h3>
                    <p className="text-xs text-muted-foreground">Limites clínicos e triagem</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>Pressão Arterial Normal:</span>
                    <strong className="text-foreground font-mono">
                      {settings.systolicMin}–{settings.systolicMax} / {settings.diastolicMin}–{settings.diastolicMax} mmHg
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>SpO₂ Mínima:</span>
                    <strong className="text-foreground font-mono">≥ {settings.oxygenMin}%</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>Frequência Cardíaca:</span>
                    <strong className="text-foreground font-mono">{settings.heartRateMin}–{settings.heartRateMax} bpm</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>IMC Normal:</span>
                    <strong className="text-foreground font-mono">≤ {settings.imcNormalMax} kg/m²</strong>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("configuracoes")}
                  className="w-full mt-4 text-xs font-semibold gap-1.5"
                >
                  <Edit3 className="size-3.5" />
                  Editar Parâmetros Clínicos
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* ABA 1: FARMÁCIAS VINCULADAS */}
        {/* ========================================================= */}
        <TabsContent value="farmacias" className="space-y-5 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Farmácias Vinculadas ao Sistema</h2>
              <p className="text-xs text-muted-foreground">
                Todas as farmácias credenciadas e pontos autorizados para promoção de campanhas comunitárias
              </p>
            </div>
            <Button
              onClick={() => {
                resetPharmacyForm();
                setIsAddPharmacyOpen(true);
              }}
              className="gap-2 text-xs font-semibold shrink-0"
            >
              <Plus className="size-4" />
              Vincular Nova Farmácia
            </Button>
          </div>

          {/* Barra de Filtros de Farmácias */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da farmácia, CNPJ, bairro ou farmacêutico..."
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={pharmacyStatusFilter}
                onChange={(e) => setPharmacyStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Todos os Status</option>
                <option value="Ativa">Ativas</option>
                <option value="Pendente">Pendentes / Em Análise</option>
                <option value="Inativa">Inativas</option>
              </select>
            </div>
          </div>

          {/* Grid de Farmácias Vinculadas */}
          {filteredPharmacies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
              <Building2 className="size-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">Nenhuma farmácia encontrada</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Não localizamos farmácias com os filtros atuais. Tente alterar a busca ou cadastre uma nova.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPharmacies.map((pharm) => {
                const pharmCampaigns = campaignsWithPharmacy.filter(
                  (c) => c.pharmacy?.id === pharm.id
                );

                return (
                  <div
                    key={pharm.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Cabeçalho do Card da Farmácia */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-foreground">{pharm.name}</h3>
                              <Badge
                                variant="outline"
                                className={
                                  pharm.status === "Ativa"
                                    ? "bg-success/10 text-success border-success/30 text-[10px]"
                                    : pharm.status === "Pendente"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]"
                                    : "bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                                }
                              >
                                {pharm.status}
                              </Badge>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">CNPJ: {pharm.cnpj}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPharmacy(pharm)}
                            title="Editar Farmácia"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePharmacy(pharm.id, pharm.name)}
                            title="Desvincular Farmácia"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Informações de Contato e Localização */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3 border-y border-border/60 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{pharm.address}, {pharm.neighborhood}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-primary shrink-0" />
                          <a
                            href={`https://wa.me/${cleanPhoneForWhatsApp(pharm.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-foreground truncate"
                          >
                            {pharm.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{pharm.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{pharm.responsible} {pharm.crf ? `(${pharm.crf})` : ""}</span>
                        </div>
                      </div>

                      {pharm.notes && (
                        <p className="mt-3 text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg">
                          "{pharm.notes}"
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Card da Farmácia */}
                    <div className="mt-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <HeartPulse className="size-3.5 text-amber-600 dark:text-amber-400" />
                        <span>
                          <strong className="text-foreground font-semibold">{pharmCampaigns.length}</strong> campanhas vinculadas
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCampaignForm((prev) => ({
                            ...prev,
                            pharmacyId: pharm.id,
                            location: `${pharm.name} - ${pharm.address}, ${pharm.neighborhood}`,
                          }));
                          setIsAddCampaignOpen(true);
                        }}
                        className="text-xs font-semibold gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        Criar Campanha
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* ABA 2: CAMPANHAS CRIADAS DAS FARMÁCIAS */}
        {/* ========================================================= */}
        <TabsContent value="campanhas" className="space-y-5 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Campanhas Criadas das Farmácias</h2>
              <p className="text-xs text-muted-foreground">
                Relação de todas as ações de triagem, aferição e saúde comunitária realizadas pelas farmácias parceiras
              </p>
            </div>
            <Button
              onClick={() => setIsAddCampaignOpen(true)}
              className="gap-2 text-xs font-semibold shrink-0"
            >
              <Plus className="size-4" />
              Nova Campanha
            </Button>
          </div>

          {/* Filtros de Campanhas */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da ação, farmácia promotora ou local..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <select
                value={campaignPharmacyFilter}
                onChange={(e) => setCampaignPharmacyFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Todas as Farmácias</option>
                {pharmacies.map((pharm) => (
                  <option key={pharm.id} value={pharm.id}>
                    {pharm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista/Tabela de Campanhas */}
          {filteredCampaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
              <HeartPulse className="size-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">Nenhuma campanha encontrada</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Não há campanhas correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{camp.name}</h3>
                      {camp.pharmacy ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                          <Building2 className="size-3" />
                          {camp.pharmacy.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Farmácia Comunitária</Badge>
                      )}
                      <Badge variant="secondary" className="bg-success/15 text-success border-success/30 text-[10px]">
                        Ativa
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="size-3.5 text-primary" />
                        {camp.date || formatCampaignPeriod(camp.startDate, camp.endDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>{camp.location}</span>
                      </span>
                    </div>

                    {camp.pharmacy && (
                      <p className="text-[11px] text-muted-foreground">
                        Farmacêutico RT: <strong className="text-foreground">{camp.pharmacy.responsible}</strong> • Contato: {camp.pharmacy.phone}
                      </p>
                    )}
                  </div>

                  {/* Métricas e Botão de Ação */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-muted-foreground">Atendimentos Registrados</div>
                      <div className="text-lg font-bold text-foreground">
                        {camp.metrics?.triagesDone || camp.recentTriages?.length || 0}
                      </div>
                    </div>

                    <Link
                      to="/"
                      search={{ campanha: camp.id }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                    >
                      Abrir no Dashboard
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* ABA 3: NOME DE TODOS OS PARTICIPANTES VINCULADOS AO SISTEMA */}
        {/* ========================================================= */}
        <TabsContent value="participantes" className="space-y-5 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Participantes Vinculados ao Sistema ({filteredParticipants.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Lista nominal de todos os participantes cadastrados na plataforma com histórico e contatos diretos
              </p>
            </div>
            <Link
              to="/participantes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Ir para Tela de Cadastro Completo
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {/* Filtros de Participantes */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do participante, CPF ou telefone..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Todas as Faixas Etárias</option>
                <option value="18–30">18 a 30 anos</option>
                <option value="31–45">31 a 45 anos</option>
                <option value="46–60">46 a 60 anos</option>
                <option value="60+">60+ anos (Idoso)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Participantes */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nome do Participante</th>
                    <th className="py-3 px-4 font-semibold">CPF</th>
                    <th className="py-3 px-4 font-semibold">Idade / Faixa</th>
                    <th className="py-3 px-4 font-semibold">Contato / WhatsApp</th>
                    <th className="py-3 px-4 font-semibold text-center">Atendimentos</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        Nenhum participante encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((part) => (
                      <tr key={part.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground text-sm">{part.name}</div>
                          <span className="text-[11px] font-mono text-muted-foreground">ID: {part.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          {formatCPF(part.cpf)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-foreground">{part.age} anos</span>
                          <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1.5 font-normal">
                            {part.ageGroup}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-muted-foreground">{formatPhone(part.phone)}</span>
                            {part.phone && (
                              <a
                                href={`https://wa.me/${cleanPhoneForWhatsApp(part.phone)}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Enviar mensagem no WhatsApp"
                                className="text-success hover:scale-110 transition-transform p-1 rounded"
                              >
                                <MessageCircle className="size-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {part.attendances?.length || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to="/participantes"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Ver Ficha
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* ABA 4: CONFIGURAÇÕES DO SISTEMA */}
        {/* ========================================================= */}
        <TabsContent value="configuracoes" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Configurações Gerais do Sistema</h2>
              <p className="text-xs text-muted-foreground">
                Defina os parâmetros clínicos padrão, limites de alertas de sinais vitais e tabela de IMC
              </p>
            </div>

            <Link
              to="/configuracao"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Abrir Página Completa de Configuração
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
            {/* Bloco 1: Limites de Sinais Vitais */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
                <span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HeartPulse className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Limites de Alerta de Sinais Vitais</h3>
                  <p className="text-xs text-muted-foreground">
                    Valores mínimos e máximos considerados normais nas triagens clínicas comunitárias
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Pressão Sistólica Normal (mmHg)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={settingsForm.systolicMin}
                      onChange={(e) => handleSettingsChange("systolicMin", e.target.value)}
                      className="text-xs"
                      placeholder="Mínimo (ex: 90)"
                    />
                    <span className="text-muted-foreground text-xs">até</span>
                    <Input
                      type="number"
                      value={settingsForm.systolicMax}
                      onChange={(e) => handleSettingsChange("systolicMax", e.target.value)}
                      className="text-xs"
                      placeholder="Máximo (ex: 139)"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Pressão Diastólica Normal (mmHg)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={settingsForm.diastolicMin}
                      onChange={(e) => handleSettingsChange("diastolicMin", e.target.value)}
                      className="text-xs"
                      placeholder="Mínimo (ex: 60)"
                    />
                    <span className="text-muted-foreground text-xs">até</span>
                    <Input
                      type="number"
                      value={settingsForm.diastolicMax}
                      onChange={(e) => handleSettingsChange("diastolicMax", e.target.value)}
                      className="text-xs"
                      placeholder="Máximo (ex: 89)"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Saturação de Oxigênio - SpO₂ (%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={settingsForm.oxygenMin}
                      onChange={(e) => handleSettingsChange("oxygenMin", e.target.value)}
                      className="text-xs"
                      placeholder="SpO2 Mínima Normal (ex: 95)"
                    />
                    <span className="text-xs text-muted-foreground">SpO₂ mínima normal</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Frequência Cardíaca (bpm)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={settingsForm.heartRateMin}
                      onChange={(e) => handleSettingsChange("heartRateMin", e.target.value)}
                      className="text-xs"
                      placeholder="Mín (ex: 50)"
                    />
                    <span className="text-muted-foreground text-xs">até</span>
                    <Input
                      type="number"
                      value={settingsForm.heartRateMax}
                      onChange={(e) => handleSettingsChange("heartRateMax", e.target.value)}
                      className="text-xs"
                      placeholder="Máx (ex: 100)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Parâmetros de IMC */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Scale className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Classificação de IMC (kg/m²)</h3>
                  <p className="text-xs text-muted-foreground">
                    Faixas de corte do Índice de Massa Corporal (Diretriz OMS / ABESO)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Abaixo do peso (até)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsForm.imcUnderweightMax}
                    onChange={(e) => handleSettingsChange("imcUnderweightMax", e.target.value)}
                    className="mt-1 text-xs"
                  />
                  <span className="text-[11px] text-muted-foreground">Padrão: 18.4 kg/m²</span>
                </div>

                <div>
                  <Label className="text-xs">Peso normal (até)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsForm.imcNormalMax}
                    onChange={(e) => handleSettingsChange("imcNormalMax", e.target.value)}
                    className="mt-1 text-xs"
                  />
                  <span className="text-[11px] text-muted-foreground">Padrão: 24.9 kg/m²</span>
                </div>

                <div>
                  <Label className="text-xs">Sobrepeso (até)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settingsForm.imcOverweightMax}
                    onChange={(e) => handleSettingsChange("imcOverweightMax", e.target.value)}
                    className="mt-1 text-xs"
                  />
                  <span className="text-[11px] text-muted-foreground">Padrão: 29.9 kg/m²</span>
                </div>
              </div>
            </div>

            {/* Botão Salvar Configurações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" className="gap-2 font-semibold">
                <Save className="size-4" />
                Salvar Configurações do Sistema
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* ========================================================= */}
      {/* MODAL: VINCULAR OU EDITAR FARMÁCIA */}
      {/* ========================================================= */}
      <Dialog open={isAddPharmacyOpen} onOpenChange={setIsAddPharmacyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <span>{editingPharmacy ? "Editar Farmácia Vinculada" : "Vincular Nova Farmácia"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre a farmácia parceira para possibilitar a criação de campanhas de saúde comunitária.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePharmacy} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Nome da Farmácia / Drogaria *</Label>
              <Input
                required
                placeholder="Ex: Farmácia Popular Centro"
                value={pharmacyForm.name}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">CNPJ *</Label>
                <Input
                  required
                  placeholder="00.000.000/0000-00"
                  value={pharmacyForm.cnpj}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, cnpj: formatCNPJ(e.target.value) })}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Status do Vínculo</Label>
                <select
                  value={pharmacyForm.status}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, status: e.target.value as any })}
                  className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Pendente">Pendente / Em Análise</option>
                  <option value="Inativa">Inativa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Farmacêutico RT / Responsável</Label>
                <Input
                  placeholder="Ex: Dra. Mariana Costa"
                  value={pharmacyForm.responsible}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, responsible: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">CRF (Registro Profissional)</Label>
                <Input
                  placeholder="Ex: CRF-MT 12345"
                  value={pharmacyForm.crf}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, crf: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input
                  placeholder="(65) 99999-9999"
                  value={pharmacyForm.phone}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: formatPhone(e.target.value) })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">E-mail de Contato</Label>
                <Input
                  type="email"
                  placeholder="contato@farmacia.com.br"
                  value={pharmacyForm.email}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Endereço (Rua, Número)</Label>
                <Input
                  placeholder="Ex: Av. Getúlio Vargas, 1420"
                  value={pharmacyForm.address}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Bairro</Label>
                <Input
                  placeholder="Ex: Centro"
                  value={pharmacyForm.neighborhood}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, neighborhood: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações / Convênio</Label>
              <Textarea
                placeholder="Detalhes da parceria, público atendido ou convênio..."
                value={pharmacyForm.notes}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, notes: e.target.value })}
                className="mt-1 text-xs"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddPharmacyOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                {editingPharmacy ? "Salvar Alterações" : "Concluir Vínculo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: NOVA CAMPANHA VINCULADA À FARMÁCIA */}
      {/* ========================================================= */}
      <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-amber-600 dark:text-amber-400" />
              <span>Nova Campanha da Farmácia</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crie uma ação de saúde comunitária vinculada a uma farmácia credenciada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCampaign} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Nome da Campanha *</Label>
              <Input
                required
                placeholder="Ex: Ação Saúde do Coração e Hipertensão"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Farmácia Vinculada</Label>
              <select
                value={campaignForm.pharmacyId}
                onChange={(e) => {
                  const pId = e.target.value;
                  const selected = pharmacies.find((p) => p.id === pId);
                  setCampaignForm({
                    ...campaignForm,
                    pharmacyId: pId,
                    location: selected ? `${selected.name} - ${selected.address}, ${selected.neighborhood}` : campaignForm.location,
                  });
                }}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                <option value="">Selecione uma farmácia...</option>
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.neighborhood})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data de Início</Label>
                <Input
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Data de Término</Label>
                <Input
                  type="date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Local / Polo de Atendimento</Label>
              <Input
                placeholder="Ex: Pátio da Farmácia Popular Centro"
                value={campaignForm.location}
                onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddCampaignOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Criar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
