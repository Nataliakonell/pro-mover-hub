import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

export default function HeaderSidebar() {
  const { isAdmin } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isAdmRoute = pathname.startsWith("/administrador") || pathname.startsWith("/configuracao");
  const showAdmin = isAdmin || isAdmRoute;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          className="hover:bg-sidebar-accent/50 active:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50 py-3 h-auto"
        >
          <Link to={showAdmin ? "/administrador" : "/"} className="flex items-center gap-3 px-1.5 py-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-inner">
              <img
                src="/conecta_saude-no-bg.svg"
                alt="Logo Conecta Saúde"
                className="size-7 object-contain"
              />
            </div>
            <div className="grid flex-1 text-left leading-snug group-data-[collapsible=icon]:hidden">
              <span className="truncate font-display font-bold text-lg tracking-tight text-white flex items-baseline">
                <span className="font-semibold text-white">Conecta</span>
                <span className="font-extrabold text-cyan-400">Saúde</span>
              </span>
              <span className="truncate text-xs font-medium text-slate-400">
                {showAdmin ? "Painel do Administrador" : "Gestão Comunitária & Ações"}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
