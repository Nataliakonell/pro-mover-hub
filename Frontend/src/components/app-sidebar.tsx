import * as React from "react";
import {
  HeartPulse,
  Users,
  Settings,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { NavMain, type NavItem } from "@/components/nav-main";
import { NavAdmin } from "@/components/nav-admin";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import HeaderSidebar from "./header-sidebar";
import { useAuth } from "@/lib/auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isAdmRoute = pathname.startsWith("/administrador") || pathname.startsWith("/configuracao");
  const showAdminView = isAdmin || isAdmRoute;

  // Itens para o Administrador (sob a seção Painel Administrador)
  const adminNavMain: NavItem[] = [
    {
      title: "Painel Administrador",
      url: "#",
      icon: ShieldCheck,
      isActive: true,
      items: [
        { title: "Visão Geral", url: "/administrador", search: { tab: "visao-geral" } },
        { title: "Farmácias Credenciadas", url: "/administrador", search: { tab: "farmacias" } },
        { title: "Campanhas", url: "/administrador", search: { tab: "campanhas" } },
        { title: "Participantes", url: "/administrador", search: { tab: "participantes" } },
        { title: "Usuários e Grupos", url: "/administrador", search: { tab: "usuarios" } },
        { title: "Configurações Gerais", url: "/configuracao" },
      ],
    },
  ];

  const adminMenus: NavItem[] = [
    {
      title: "Configurações",
      url: "/configuracao",
      icon: Settings,
    },
  ];

  // Itens para a Farmácia Cadastrada
  const pharmacyNavMain: NavItem[] = [
    {
      title: "Campanhas",
      url: "/",
      icon: HeartPulse,
    },
    {
      title: "Participantes",
      url: "/participantes",
      icon: Users,
    },
  ];

  const pharmacyMenus: NavItem[] = [
    {
      title: "Configurações",
      url: "/configuracao",
      icon: Settings,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <HeaderSidebar />
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={showAdminView ? adminNavMain : pharmacyNavMain}
          label="Menus principais"
        />
        <NavAdmin
          menus={showAdminView ? adminMenus : pharmacyMenus}
          label="Administração"
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
