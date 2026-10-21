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
  MessageCircle,
  ChevronRight,
  Stethoscope,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Layers,
  Store,
  UserCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useUsers, usePharmacyGroups } from "@/lib/users";
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

export const Route = createFileRoute("/administrador")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
    };
  },
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
  const search = Route.useSearch();
  const { user, isAdmin } = useAuth();

  // Dados das áreas solicitadas
  const { pharmacies, addPharmacy, updatePharmacy, removePharmacy } = usePharmacies();
  const { events, refreshEvents } = useDashboardEvents();
  const { participants } = useParticipants();

  // Controle de Abas sincronizado com a URL (?tab=...) e fallback para window.location.search
  const getInitialTab = (): string => {
    if (typeof search.tab === "string" && search.tab) return search.tab;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) return tabParam;
    }
    return "visao-geral";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  useEffect(() => {
    const target = (search.tab as string) || getInitialTab();
    if (target && target !== activeTab) {
      setActiveTab(target);
    }
  }, [search.tab]);

  // Listener para sincronização direta caso a URL mude via histórico do navegador
  useEffect(() => {
    const handlePopState = () => {
      const current = getInitialTab();
      if (current !== activeTab) {
        setActiveTab(current);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate({
      to: "/administrador",
      search: { tab: newTab },
      replace: true,
    });
  };

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
  // 4. Estados e Hooks para USUÁRIOS E GRUPOS (Multi-Tenant)
  // ---------------------------------------------------------
  const { users, addUser, removeUser } = useUsers();
  const { groups, addGroup } = usePharmacyGroups();

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    username: "",
    role: "pharmacy_user",
    groupId: "",
    pharmacyId: "",
  });

  const [groupForm, setGroupForm] = useState({
    name: "",
    cnpj: "",
    responsible: "",
    phone: "",
    email: "",
  });

  // Modal de sucesso exibindo a senha temporária gerada
  const [createdUserResult, setCreatedUserResult] = useState<{
    user: any;
    temporaryPassword?: string;
  } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) return;

    try {
      const res = await addUser({
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        username: userForm.username.trim() || undefined,
        role: userForm.role,
        groupId: userForm.groupId || null,
        pharmacyId: userForm.pharmacyId || null,
      });

      setCreatedUserResult(res);
      setIsAddUserOpen(false);
      setUserForm({
        name: "",
        email: "",
        username: "",
        role: "pharmacy_user",
        groupId: "",
        pharmacyId: "",
      });
      setIsSuccessModalOpen(true);
      showToast(`Usuário "${res.user.name}" cadastrado com sucesso!`);
    } catch (err: any) {
      showToast(`Erro ao cadastrar usuário: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (user?.id === id) {
      showToast("Você não pode excluir a sua própria conta.");
      return;
    }
    if (window.confirm(`Deseja realmente excluir o usuário "${name}" do sistema?`)) {
      try {
        await removeUser(id);
        showToast(`Usuário "${name}" removido com sucesso.`);
      } catch (err: any) {
        showToast(`Erro ao excluir usuário: ${err.message}`);
      }
    }
  };

  const handleSaveGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;

    try {
      const created = await addGroup({
        name: groupForm.name.trim(),
        cnpj: groupForm.cnpj.trim() || undefined,
        responsible: groupForm.responsible.trim() || undefined,
        phone: groupForm.phone.trim() || undefined,
        email: groupForm.email.trim() || undefined,
      });

      setIsAddGroupOpen(false);
      setGroupForm({
        name: "",
        cnpj: "",
        responsible: "",
        phone: "",
        email: "",
      });
      showToast(`Grupo de Farmácias "${created.name}" cadastrado com sucesso!`);
    } catch (err: any) {
      showToast(`Erro ao cadastrar grupo: ${err.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.group?.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.pharmacy?.name || "").toLowerCase().includes(userSearch.toLowerCase());

      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

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
  const isUserAdmin =
    isAdmin || ["admin", "administrador", "superadmin"].includes(user?.role?.toLowerCase() || "");

  if (!isUserAdmin) {
    return (
      <AppLayout title="Acesso Restrito">
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito ao Administrador</h2>
          <p className="mt-2 text-sm text-muted-foreground">
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

  // Header dinâmico exclusivo por tela/rota
  const getHeaderInfo = () => {
    switch (activeTab) {
      case "farmacias":
        return {
          title: "Farmácias Credenciadas",
          actions: (
            <Button
              size="sm"
              onClick={() => {
                resetPharmacyForm();
                setIsAddPharmacyOpen(true);
              }}
              className="h-10 px-3.5 sm:px-4 gap-2 text-sm font-semibold"
            >
              <Building2 className="size-4 shrink-0" />
              <span>Vincular Farmácia</span>
            </Button>
          ),
        };
      case "campanhas":
        return {
          title: "Campanhas",
          actions: (
            <Button
              size="sm"
              onClick={() => setIsAddCampaignOpen(true)}
              className="h-10 px-3.5 sm:px-4 gap-2 text-sm font-semibold"
            >
              <Plus className="size-4 shrink-0" />
              <span>Nova Campanha</span>
            </Button>
          ),
        };
      case "participantes":
        return {
          title: "Participantes",
          actions: null,
        };
      case "usuarios":
        return {
          title: "Gestão de Usuários & Grupos",
          actions: (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddGroupOpen(true)}
                className="h-10 px-3.5 sm:px-4 gap-2 text-sm font-semibold"
              >
                <Layers className="size-4 text-primary shrink-0" />
                <span className="hidden sm:inline">Novo</span> Grupo
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                className="h-10 px-3.5 sm:px-4 gap-2 text-sm font-semibold"
              >
                <UserPlus className="size-4 shrink-0" />
                <span>Novo Usuário</span>
              </Button>
            </div>
          ),
        };
      case "visao-geral":
      default:
        return {
          title: (
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold">Painel do Administrador</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5 px-2 shrink-0">
                <ShieldCheck className="size-3.5 mr-1 inline" />
                Admin
              </Badge>
            </div>
          ),
          actions: (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  resetPharmacyForm();
                  setIsAddPharmacyOpen(true);
                }}
                className="h-10 px-3 sm:px-4 gap-2 text-sm font-semibold"
              >
                <Building2 className="size-4 text-primary shrink-0" />
                <span className="hidden sm:inline">Vincular</span> Farmácia
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAddCampaignOpen(true)}
                className="h-10 px-3.5 sm:px-4 gap-2 text-sm font-semibold"
              >
                <Plus className="size-4 shrink-0" />
                <span className="hidden sm:inline">Nova</span> Campanha
              </Button>
            </div>
          ),
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <AppLayout
      title={headerInfo.title}
      actions={headerInfo.actions}
    >
      {/* Toast Alert Flutuante */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 left-4 sm:left-auto z-50 flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="size-4.5 text-success shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Abas de Navegação Superior do Administrador */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-6 border-b border-border/80">
        {[
          { id: "visao-geral", label: "Visão Geral", icon: Sparkles },
          { id: "farmacias", label: "Farmácias Credenciadas", icon: Building2 },
          { id: "campanhas", label: "Campanhas", icon: HeartPulse },
          { id: "participantes", label: "Participantes", icon: Users },
          { id: "usuarios", label: "Usuários e Grupos", icon: UserCheck },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. VISÃO GERAL */}
      {/* ========================================================= */}
      {activeTab === "visao-geral" && (
        <div className="space-y-6">
          {/* Cards de Métricas Principais (KPIs) - Exclusivo na Visão Geral */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Card 1: Farmácias */}
            <div
              onClick={() => handleTabChange("farmacias")}
              className="group cursor-pointer rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Farmácias</span>
                <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Building2 className="size-4 sm:size-4.5" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {pharmacies.length}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {activePharmaciesCount} ativas
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                Polos credenciados
              </p>
            </div>

            {/* Card 2: Campanhas */}
            <div
              onClick={() => handleTabChange("campanhas")}
              className="group cursor-pointer rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-semibold text-muted-foreground truncate">Campanhas</span>
                <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <HeartPulse className="size-4 sm:size-4.5" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {totalCampaignsCount}
                </span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  ações
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                Promoções de saúde
              </p>
            </div>

            {/* Card 3: Participantes */}
            <div
              onClick={() => handleTabChange("participantes")}
              className="group cursor-pointer rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-semibold text-muted-foreground truncate">Participantes</span>
                <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                  <Users className="size-4 sm:size-4.5" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {totalParticipantsCount}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400">
                  cadastrados
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                Cidadãos assistidos
              </p>
            </div>

            {/* Card 4: Usuários e Grupos */}
            <div
              onClick={() => handleTabChange("usuarios")}
              className="group cursor-pointer rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-semibold text-muted-foreground truncate">Usuários & Grupos</span>
                <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="size-4 sm:size-4.5" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  {users.length}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {groups.length} grupos
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                Acessos multi-tenant
              </p>
            </div>
          </section>

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
                      <h3 className="font-bold text-lg text-foreground">Farmácias Parceiras em Destaque</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("farmacias")}
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
                                ? "bg-success/15 text-success border-success/30 text-xs"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs"
                            }
                          >
                            {pharm.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                          <MapPin className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{pharm.neighborhood}, {pharm.city}</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Phone className="size-3 shrink-0 text-muted-foreground" />
                          <span>{pharm.phone}</span>
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-sm text-muted-foreground">
                        <span className="text-xs">Resp: <strong className="text-foreground font-medium">{pharm.responsible.split(" ")[0]}</strong></span>
                        <span className="text-xs font-mono">{pharm.cnpj}</span>
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
                      <h3 className="font-bold text-lg text-foreground">Últimas Campanhas Comunitárias</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("campanhas")}
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
                            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                              {camp.pharmacy.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTabChange("campanhas")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2.5 py-1.5 rounded-lg bg-primary/10 transition-colors"
                        >
                          Ver no Administrador
                          <ArrowUpRight className="size-3.5" />
                        </Button>
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
                    onClick={() => handleTabChange("participantes")}
                    className="text-xs text-primary"
                  >
                    Ver ({participants.length})
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
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
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{part.cpf}</span>
                          <span>•</span>
                          <span>{part.age} anos ({part.ageGroup})</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {part.attendances?.length || 0} presenças
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={() => handleTabChange("participantes")}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors"
                  >
                    Gerenciar Participantes no Administrador
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FARMÁCIAS CREDENCIADAS */}
      {/* ========================================================= */}
      {activeTab === "farmacias" && (
        <div className="space-y-5">
          {/* Barra de Filtros de Farmácias */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, bairro ou responsável..."
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                className="pl-9 h-11 sm:h-9 text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pharmacyStatusFilter}
                onChange={(e) => setPharmacyStatusFilter(e.target.value)}
                className="w-full sm:w-auto h-11 sm:h-9 px-3 rounded-md border border-input bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
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
                                    ? "bg-success/10 text-success border-success/30 text-xs"
                                    : pharm.status === "Pendente"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs"
                                    : "bg-destructive/10 text-destructive border-destructive/30 text-xs"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3 border-y border-border/60 text-sm text-muted-foreground">
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
                        <p className="mt-3 text-sm text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg">
                          "{pharm.notes}"
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Card da Farmácia */}
                    <div className="mt-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CAMPANHAS */}
      {/* ========================================================= */}
      {activeTab === "campanhas" && (
        <div className="space-y-5">
          {/* Filtros de Campanhas */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da ação, farmácia promotora ou local..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="pl-9 h-11 sm:h-9 text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={campaignPharmacyFilter}
                onChange={(e) => setCampaignPharmacyFilter(e.target.value)}
                className="w-full sm:w-auto h-11 sm:h-9 px-3 rounded-md border border-input bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
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
                      <Badge variant="secondary" className="bg-success/15 text-success border-success/30 text-xs">
                        Ativa
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground">
                        Farmacêutico RT: <strong className="text-foreground">{camp.pharmacy.responsible}</strong> • Contato: {camp.pharmacy.phone}
                      </p>
                    )}
                  </div>

                  {/* Métricas e Botão de Ação */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="text-left md:text-right">
                      <div className="text-sm text-muted-foreground">Atendimentos Registrados</div>
                      <div className="text-lg font-bold text-foreground">
                        {camp.metrics?.triagesDone || camp.recentTriages?.length || 0}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3.5 py-2 rounded-lg">
                      <HeartPulse className="size-3.5" />
                      Ação Registrada
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PARTICIPANTES */}
      {/* ========================================================= */}
      {activeTab === "participantes" && (
        <div className="space-y-5">
          {/* Filtros de Participantes */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou WhatsApp..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="pl-9 h-11 sm:h-9 text-sm bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="w-full sm:w-auto h-11 sm:h-9 px-3 rounded-md border border-input bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">Todas as Faixas Etárias</option>
                <option value="18–30">18 a 30 anos</option>
                <option value="31–45">31 a 45 anos</option>
                <option value="46–60">46 a 60 anos</option>
                <option value="60+">60+ anos (Idoso)</option>
              </select>
            </div>
          </div>

          {/* Visualização em Cards para Telas Mobile */}
          <div className="block md:hidden space-y-3">
            {filteredParticipants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
                Nenhum participante encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredParticipants.map((part) => (
                <div
                  key={part.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{part.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                        <span>CPF: {formatCPF(part.cpf)}</span>
                        <span>•</span>
                        <span>ID: {part.id}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">
                      {part.attendances?.length || 0} presenças
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-border/50">
                    <span className="font-medium text-foreground">{part.age} anos</span>
                    <Badge variant="secondary" className="text-xs py-0 px-1.5">
                      {part.ageGroup}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-muted-foreground">{formatPhone(part.phone)}</span>
                      {part.phone && (
                        <a
                          href={`https://wa.me/${cleanPhoneForWhatsApp(part.phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Enviar mensagem no WhatsApp"
                          className="p-1.5 rounded-md text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Cadastrado
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabela de Participantes para Telas Médias e Desktop */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-xs tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nome do Participante</th>
                    <th className="py-3 px-4 font-semibold">CPF</th>
                    <th className="py-3 px-4 font-semibold">Idade / Faixa</th>
                    <th className="py-3 px-4 font-semibold">Contato / WhatsApp</th>
                    <th className="py-3 px-4 font-semibold text-center">Atendimentos</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
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
                          <span className="text-xs font-mono text-muted-foreground">ID: {part.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          {formatCPF(part.cpf)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-foreground">{part.age} anos</span>
                          <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5 font-normal">
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
                          <Badge variant="secondary" className="text-xs">
                            Cadastrado
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. GESTÃO DE USUÁRIOS E GRUPOS MULTI-TENANT */}
      {/* ========================================================= */}
      {activeTab === "usuarios" && (
        <div className="space-y-6">
          {/* Barra de Filtros e Busca de Usuários */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário por nome, e-mail, perfil ou farmácia..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                aria-label="Filtrar por perfil"
                className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="ALL">Todos os Perfis ({users.length})</option>
                <option value="admin">Administrador Geral</option>
                <option value="group_manager">Gestor do Grupo</option>
                <option value="pharmacy_user">Usuário da Farmácia</option>
                <option value="client">Cliente / Participante</option>
              </select>
            </div>
          </div>

          {/* Cards Resumo / Seção de Grupos de Farmácias */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Grupos de Farmácias ({groups.length})</h3>
                  <p className="text-xs text-muted-foreground">Grupos econômicos que consolidam redes ou unidades parceiras.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddGroupOpen(true)}
                className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0"
              >
                <Plus className="size-3.5" />
                Cadastrar Grupo
              </Button>
            </div>

            {groups.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border/70 rounded-lg">
                <Store className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Nenhum Grupo de Farmácias cadastrado no momento</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cadastre um grupo caso uma rede possua múltiplas unidades sob a mesma gestão.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{g.name}</h4>
                        <span className="font-mono text-xs text-muted-foreground">{g.id}</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {g.pharmacies?.length || 0} unidades
                      </Badge>
                    </div>
                    {g.cnpj && (
                      <div className="text-xs text-muted-foreground font-mono">
                        CNPJ: {formatCNPJ(g.cnpj)}
                      </div>
                    )}
                    {g.responsible && (
                      <div className="text-xs text-muted-foreground truncate">
                        Responsável: <span className="font-medium text-foreground">{g.responsible}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabela de Usuários Cadastrados */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4.5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Usuários e Permissões de Acesso ({filteredUsers.length})</h3>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center border-dashed border-border">
                <Users className="size-10 text-muted-foreground/60 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-foreground">Nenhum usuário encontrado</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Não foram encontrados usuários com os critérios de busca selecionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/70 text-muted-foreground uppercase text-xs tracking-wider font-semibold border-b border-border">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Usuário</th>
                      <th className="py-3 px-4 font-semibold">Perfil (Role)</th>
                      <th className="py-3 px-4 font-semibold">Grupo / Farmácia</th>
                      <th className="py-3 px-4 font-semibold text-center">Status da Senha</th>
                      <th className="py-3 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => {
                      const isCurrentUser = user?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1 text-primary border-primary/30">
                                      Você
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                                {u.username && (
                                  <span className="text-[11px] font-mono text-muted-foreground">@{u.username}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {u.role === "admin" && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Administrador Geral</Badge>
                            )}
                            {u.role === "group_manager" && (
                              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">Gestor de Grupo</Badge>
                            )}
                            {u.role === "pharmacy_user" && (
                              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">Usuário da Farmácia</Badge>
                            )}
                            {u.role === "client" && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">Cliente / Paciente</Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {u.group ? (
                              <div className="text-xs font-medium text-foreground flex items-center gap-1">
                                <Layers className="size-3 text-purple-500 shrink-0" />
                                <span>{u.group.name}</span>
                              </div>
                            ) : null}
                            {u.pharmacy ? (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="size-3 text-primary shrink-0" />
                                <span>{u.pharmacy.name}</span>
                              </div>
                            ) : null}
                            {!u.group && !u.pharmacy && (
                              <span className="text-xs text-muted-foreground italic">Acesso Global / Sem vínculo</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {u.mustChangePassword ? (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 inline-flex items-center">
                                <KeyRound className="size-3" />
                                <span>Troca no 1º Login Pendente</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 inline-flex items-center">
                                <CheckCircle2 className="size-3" />
                                <span>Senha Ativa</span>
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {!isCurrentUser && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VINCULAR OU EDITAR FARMÁCIA */}
      {/* ========================================================= */}
      <Dialog open={isAddPharmacyOpen} onOpenChange={setIsAddPharmacyOpen}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>{editingPharmacy ? "Editar Farmácia Vinculada" : "Vincular Nova Farmácia"}</DialogTitle>
                <DialogDescription>Cadastre a farmácia parceira para possibilitar a criação de campanhas de saúde comunitária.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePharmacy} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Nome da Farmácia / Drogaria *</Label>
                <Input
                  required
                  placeholder="Ex: Farmácia Popular Centro"
                  value={pharmacyForm.name}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">CNPJ *</Label>
                  <Input
                    required
                    placeholder="00.000.000/0000-00"
                    value={pharmacyForm.cnpj}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, cnpj: formatCNPJ(e.target.value) })}
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Status do Vínculo</Label>
                  <select
                    value={pharmacyForm.status}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, status: e.target.value as any })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Pendente">Pendente / Em Análise</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Farmacêutico RT / Responsável</Label>
                  <Input
                    placeholder="Ex: Dra. Mariana Costa"
                    value={pharmacyForm.responsible}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, responsible: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">CRF (Registro Profissional)</Label>
                  <Input
                    placeholder="Ex: CRF-MT 12345"
                    value={pharmacyForm.crf}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, crf: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Telefone / WhatsApp</Label>
                  <Input
                    placeholder="(65) 99999-9999"
                    value={pharmacyForm.phone}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: formatPhone(e.target.value) })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">E-mail de Contato</Label>
                  <Input
                    type="email"
                    placeholder="contato@farmacia.com.br"
                    value={pharmacyForm.email}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Endereço (Rua, Número)</Label>
                  <Input
                    placeholder="Ex: Av. Getúlio Vargas, 1420"
                    value={pharmacyForm.address}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Bairro</Label>
                  <Input
                    placeholder="Ex: Centro"
                    value={pharmacyForm.neighborhood}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, neighborhood: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Observações / Convênio</Label>
                <Textarea
                  placeholder="Detalhes da parceria, público atendido ou convênio..."
                  value={pharmacyForm.notes}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, notes: e.target.value })}
                  className="text-sm rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPharmacyOpen(false)}
                className="h-9 px-4 text-sm font-medium rounded-md"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-sm font-medium rounded-md shadow-sm"
              >
                {editingPharmacy ? "Salvar alterações" : "Concluir vínculo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: NOVA CAMPANHA VINCULADA À FARMÁCIA */}
      {/* ========================================================= */}
      <Dialog open={isAddCampaignOpen} onOpenChange={setIsAddCampaignOpen}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Nova Campanha da Farmácia</DialogTitle>
                <DialogDescription>Crie uma ação de saúde comunitária vinculada a uma farmácia credenciada.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCampaign} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Nome da Campanha *</Label>
                <Input
                  required
                  placeholder="Ex: Ação Saúde do Coração e Hipertensão"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Farmácia Vinculada</Label>
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
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Selecione uma farmácia...</option>
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    Data de Início
                  </Label>
                  <Input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    Data de Término
                  </Label>
                  <Input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                  <MapPin className="size-4 text-muted-foreground" />
                  Local / Polo de Atendimento
                </Label>
                <Input
                  placeholder="Ex: Pátio da Farmácia Popular Centro"
                  value={campaignForm.location}
                  onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCampaignOpen(false)}
                className="h-9 px-4 text-sm font-medium rounded-md"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-sm font-medium rounded-md shadow-sm"
              >
                Criar Campanha
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: NOVO USUÁRIO MULTI-TENANT */}
      {/* ========================================================= */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                <DialogDescription>Uma senha temporária randômica será gerada com exigência de troca no 1º login.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Nome Completo *</Label>
                <Input
                  required
                  placeholder="Ex: Carlos Alberto Mendes"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">E-mail de Acesso *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="carlos@farmacia.com.br"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Nome de Usuário (Opcional)</Label>
                  <Input
                    placeholder="Ex: carlos.mendes"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Perfil de Acesso (Role) *</Label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="pharmacy_user">Usuário da Farmácia (Escopo da farmácia selecionada)</option>
                  <option value="group_manager">Gestor do Grupo de Farmácias (Escopo do grupo econômico)</option>
                  <option value="admin">Administrador Geral (Acesso irrestrito a todo o sistema)</option>
                  <option value="client">Cliente / Paciente (Histórico clínico pessoal)</option>
                </select>
              </div>

              {/* Se for Gestor de Grupo, seleciona o Grupo */}
              {userForm.role === "group_manager" && (
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Grupo de Farmácias *</Label>
                  {groups.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-300">
                      Nenhum Grupo de Farmácias cadastrado no banco. Cadastre um grupo antes de associar o gestor.
                    </div>
                  ) : (
                    <select
                      value={userForm.groupId}
                      onChange={(e) => setUserForm({ ...userForm, groupId: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                    >
                      <option value="">Selecione o Grupo de Farmácias...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Se for Usuário de Farmácia, seleciona a Farmácia */}
              {userForm.role === "pharmacy_user" && (
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Farmácia Vinculada *</Label>
                  {pharmacies.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-300">
                      Nenhuma farmácia cadastrada no banco. Vincule uma farmácia antes de associar o usuário.
                    </div>
                  ) : (
                    <select
                      value={userForm.pharmacyId}
                      onChange={(e) => setUserForm({ ...userForm, pharmacyId: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                    >
                      <option value="">Selecione a Farmácia de atuação...</option>
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.neighborhood} ({p.cnpj})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted/60 border border-border rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                <KeyRound className="size-4 text-primary shrink-0" />
                <span>
                  O sistema gerará uma <strong>senha aleatória segura</strong> no PostgreSQL e exigirá a troca imediata assim que o usuário fizer o primeiro login.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="h-9 px-4 text-sm font-medium rounded-md"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-sm font-medium rounded-md shadow-sm"
              >
                Gerar Credencial e Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: NOVO GRUPO DE FARMÁCIAS */}
      {/* ========================================================= */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Novo Grupo de Farmácias</DialogTitle>
                <DialogDescription>Cadastre a rede ou holding que administra uma ou mais farmácias parceiras.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGroup} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Nome do Grupo / Rede *</Label>
                <Input
                  required
                  placeholder="Ex: Grupo Drogaria Saúde & Vida"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">CNPJ da Matriz / Grupo</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={groupForm.cnpj}
                  onChange={(e) => setGroupForm({ ...groupForm, cnpj: formatCNPJ(e.target.value) })}
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Responsável / Proprietário</Label>
                  <Input
                    placeholder="Ex: Roberto Silva"
                    value={groupForm.responsible}
                    onChange={(e) => setGroupForm({ ...groupForm, responsible: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">Telefone de Contato</Label>
                  <Input
                    placeholder="(65) 99999-9999"
                    value={groupForm.phone}
                    onChange={(e) => setGroupForm({ ...groupForm, phone: formatPhone(e.target.value) })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">E-mail de Contato</Label>
                <Input
                  type="email"
                  placeholder="gestao@gruposaude.com.br"
                  value={groupForm.email}
                  onChange={(e) => setGroupForm({ ...groupForm, email: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddGroupOpen(false)}
                className="h-9 px-4 text-sm font-medium rounded-md"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-sm font-medium rounded-md shadow-sm"
              >
                Cadastrar Grupo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: SUCESSO - EXIBIR SENHA RANDÔMICA TEMPORÁRIA */}
      {/* ========================================================= */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Usuário Criado com Sucesso!</DialogTitle>
                <DialogDescription>Guarde ou envie a senha temporária gerada para o novo usuário.</DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <strong>Nome:</strong> {createdUserResult?.user?.name}
              </p>
              <p>
                <strong>E-mail:</strong> {createdUserResult?.user?.email}
              </p>
              <p>
                <strong>Perfil:</strong> {createdUserResult?.user?.role}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Senha Temporária de 1º Acesso
              </div>
              <div className="flex items-center justify-between gap-2 bg-background p-3 rounded-lg border border-border">
                <span className="font-mono text-base font-bold text-primary tracking-widest select-all">
                  {createdUserResult?.temporaryPassword}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (createdUserResult?.temporaryPassword) {
                      navigator.clipboard.writeText(createdUserResult.temporaryPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2500);
                    }
                  }}
                  className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                >
                  {copiedPassword ? (
                    <>
                      <Check className="size-3.5 text-success" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O usuário utilizará esta senha temporária para autenticar pela primeira vez. Por medidas de segurança e conformidade, o sistema exigirá que ele <strong>crie uma nova senha pessoal</strong> antes de acessar as funcionalidades.
            </p>
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-muted/40 shrink-0">
            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="h-9 px-5 text-sm font-semibold"
            >
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
