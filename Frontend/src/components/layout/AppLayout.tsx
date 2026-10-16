import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  HeartPulse,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, setRole } = useAuth();

  const navigation = [
    { name: "Campanhas", href: "/", icon: LayoutDashboard },
    { name: "Participantes", href: "/participantes", icon: Users },
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
        <Link to="/" className="flex min-w-0 items-center gap-0 group transition-opacity hover:opacity-90">
          <div className="flex shrink-0 items-center justify-center transition-transform group-hover:scale-105">
            <img
              src="/conecta_saude-no-bg.svg"
              alt="Ícone Conecta Saúde"
              className="size-15 object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="-ml-1 flex items-baseline truncate text-2xl leading-none tracking-tight">
              <span className="font-light text-[#1e2a33]">Conecta</span>
              <span className="font-extrabold text-[#0f3d4c]">Saúde</span>
              <span className="ml-0.5 font-extrabold text-[#14b8a6]">.</span>
            </h1>
          </div>
        </Link>

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

        {/* Rodapé da Sidebar: Perfil */}
        <div className="mt-6 space-y-3 border-t border-border pt-5 md:mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {(user.name || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name || "Usuário"}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabels[user.role]}</p>
            </div>
          </div>

          {/* Seletor demonstrativo de Perfil Autenticado */}
          <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
            <UserCheck className="size-4 shrink-0 text-primary" />
            <span className="font-medium text-muted-foreground">Perfil:</span>
            <select
              id="profile-select"
              aria-label="Perfil autenticado"
              value={user.role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="min-w-0 flex-1 cursor-pointer bg-transparent font-semibold text-foreground outline-none"
            >
              <option value="admin">Administrador</option>
              <option value="fisioterapeuta">Fisioterapeuta</option>
              <option value="avaliador">Avaliador / Voluntário</option>
              <option value="recepcao">Recepção</option>
            </select>
          </label>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex min-w-0 flex-col">
        {/* Cabeçalho Superior: título da página + ações */}
        <header className="flex min-h-20 flex-col gap-3 border-b border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        {/* Corpo da Página */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
