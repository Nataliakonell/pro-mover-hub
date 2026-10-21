// Sidebar principal de navegação da aplicação
import * as React from "react";
import {
  HeartPulse,
  Users,
  Settings,
  ShieldCheck,
} from "lucide-react";

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

  const navMain: NavItem[] = [
    {
      title: "Campanhas",
      url: "/",
      icon: HeartPulse,
      isActive: false,
    },
    {
      title: "Participantes",
      url: "/participantes",
      icon: Users,
    },
  ];

  const adminMenus: NavItem[] = [
    {
      title: "Painel Administrador",
      url: "/administrador",
      icon: ShieldCheck,
      badge: isAdmin ? "Admin" : undefined,
    },
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
        <NavMain items={navMain} label="Ações Comunitárias" />
        <NavAdmin menus={adminMenus} label="Administração" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
export default AppSidebar;
