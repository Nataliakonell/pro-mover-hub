import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  HeartPulse,
  Users,
  Settings,
  ShieldCheck,
  Menu,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth";

interface AppLayoutProps {
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

function MobileBottomBar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { toggleSidebar } = useSidebar();
  const { isAdmin } = useAuth();

  const items = [
    { name: "Campanhas", href: "/", icon: HeartPulse },
    { name: "Participantes", href: "/participantes", icon: Users },
    ...(isAdmin ? [{ name: "Admin", href: "/administrador", icon: ShieldCheck }] : []),
    { name: "Configurações", href: "/configuracao", icon: Settings },
  ];

  return (
    <nav
      aria-label="Navegação rápida móvel"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-md shadow-lg md:hidden"
    >
      {items.map(({ name, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`size-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[11px] leading-none">{name}</span>
          </Link>
        );
      })}

      {/* Botão para abrir gaveta completa com sub-menus e perfil */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Mais opções"
      >
        <Menu className="size-5 stroke-2" />
        <span className="text-[11px] leading-none">Menu</span>
      </button>
    </nav>
  );
}

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen min-w-0 bg-background">
        {/* Cabeçalho Superior com SidebarTrigger, Título e Ações */}
        <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-3.5 sm:px-6 backdrop-blur-sm transition-[width,height] ease-linear">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* SidebarTrigger: no desktop recolhe para mini sidebar; no mobile abre a gaveta */}
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border shrink-0" />

            <div className="min-w-0">
              {title && (
                <div className="truncate font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {title}
                </div>
              )}
              {subtitle && (
                <p className="hidden sm:block truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </header>

        {/* Corpo principal do conteúdo */}
        <main className="flex-1 w-full min-w-0 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Barra rápida inferior no mobile */}
        <MobileBottomBar />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppLayout;
