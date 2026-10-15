import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Gift,
  Settings,
  Activity,
  HeartPulse,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, setRole } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Participantes", href: "/participantes", icon: Users },
    { name: "Prontuários", href: "/prontuarios", icon: ClipboardList },
    { name: "Sessões Cortesia", href: "/sessoes-cortesia", icon: Gift },
    { name: "Configurações", href: "/configuracao", icon: Settings },
  ];

  const roleLabels: Record<UserRole, string> = {
    admin: "Administrador",
    fisioterapeuta: "Fisioterapeuta",
    avaliador: "Avaliador / Voluntário",
    recepcao: "Recepção",
  };

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      {/* Barra Lateral / Sidebar */}
      <aside className="bg-card px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-border md:py-8">
        <div className="flex min-w-0 items-center gap-3 px-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-6" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold tracking-tight">PRO-MOVER.</h1>
            <p className="mt-0.5 text-xs uppercase font-medium tracking-wider text-muted-foreground">Saúde em movimento</p>
          </div>
        </div>

        <p className="mb-3 mt-9 hidden px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 md:block">
          Área de trabalho
        </p>

        {/* Links de navegação para as rotas */}
        <nav aria-label="Navegação do painel" className="mt-5 flex gap-1.5 overflow-x-auto md:mt-0 md:flex-col md:overflow-visible">
          {navigation.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                to={href}
                className={`inline-flex h-11 shrink-0 items-center gap-3.5 rounded-lg px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-secondary text-secondary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground font-medium hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon strokeWidth={1.8} className="size-5 shrink-0" />
                <span className="truncate">{name}</span>
                {name === "Configurações" && user.role !== "admin" && (
                  <span className="ml-auto text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">admin</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="mt-auto hidden pt-6 md:block">
          <div className="border-t border-border px-2 pt-5">
            <HeartPulse className="mb-2 size-5 text-primary" strokeWidth={1.8} />
            <p className="text-sm font-semibold text-foreground">Cuidar conecta pessoas.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Studio Adriane Câmara</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex min-w-0 flex-col">
        {/* Cabeçalho Superior */}
        <header className="grid h-[74px] sm:h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-5 lg:px-8">
          <div className="flex items-center gap-2 truncate text-sm">
            <span className="text-muted-foreground">Plataforma comunitária</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">
              {navigation.find((n) => isActive(n.href))?.name || "Painel"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor demonstrativo de Perfil Autenticado */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs sm:text-sm">
              <UserCheck className="size-4 text-primary shrink-0" />
              <span className="hidden sm:inline font-medium text-muted-foreground">Perfil:</span>
              <select
                aria-label="Perfil autenticado"
                value={user.role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent font-semibold text-foreground outline-none cursor-pointer text-xs sm:text-sm"
              >
                <option value="admin">Administrador (Admin)</option>
                <option value="fisioterapeuta">Fisioterapeuta</option>
                <option value="avaliador">Avaliador / Voluntário</option>
                <option value="recepcao">Recepção</option>
              </select>
            </div>

            <span className="hidden sm:flex items-center gap-2 rounded-full border border-primary/10 bg-secondary/60 px-3.5 py-1.5 text-xs text-secondary-foreground font-medium">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Ambiente demonstrativo</span>
            </span>
          </div>
        </header>

        {/* Corpo da Página */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 lg:px-8">
          {(title || actions) && (
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {subtitle && <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
                {title && <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">{title}</h2>}
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
