// Sidebar principal de navegação da aplicação
import * as React from "react";
import {
  HeartPulse,
  Users,
  Settings,
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
  const { user } = useAuth();

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
        <NavAdmin menus={adminMenus} label="Sistema" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user.name || "Usuário",
            email: user.email || "usuario@conectasaude.org",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
export default AppSidebar;
