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
          className="hover:bg-sidebar-accent/50 active:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50 py-2.5 h-auto"
        >
          <Link to={showAdmin ? "/administrador" : "/"} className="flex items-center gap-3 px-1.5 py-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <img
                src="/conecta_saude-no-bg.svg"
                alt="Logo Conecta Saúde"
                className="size-8 object-contain"
              />
            </div>
            <div className="grid flex-1 text-left leading-snug group-data-[collapsible=icon]:hidden">
              <span className="truncate font-display font-bold text-lg tracking-tight text-sidebar-foreground flex items-baseline">
                <span className="font-light text-[#1e2a33]">Conecta</span>
                <span className="font-extrabold text-[#0f3d4c]">Saúde</span>
                <span className="font-extrabold text-[#14b8a6]">.</span>
              </span>
              <span className="truncate text-[13px] font-medium text-muted-foreground">
                {showAdmin ? "Painel do Administrador" : "Gestão Comunitária & Ações"}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
