import * as React from "react";
import { Link } from "@tanstack/react-router";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export default function HeaderSidebar() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          className="hover:bg-sidebar-accent/50 active:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50"
        >
          <Link to="/" className="flex items-center gap-3 px-1 py-1.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <img
                src="/conecta_saude-no-bg.svg"
                alt="Logo Conecta Saúde"
                className="size-7 object-contain"
              />
            </div>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-display font-bold text-base tracking-tight text-sidebar-foreground flex items-baseline">
                <span className="font-light text-[#1e2a33]">Conecta</span>
                <span className="font-extrabold text-[#0f3d4c]">Saúde</span>
                <span className="font-extrabold text-[#14b8a6]">.</span>
              </span>
              <span className="truncate text-[11px] font-medium text-muted-foreground">
                Gestão Comunitária & Ações
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
