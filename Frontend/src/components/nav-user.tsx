import {
  ChevronsUpDown,
  UserCheck,
  Shield,
  Stethoscope,
  HeartHandshake,
  Users,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, UserRole } from "@/lib/auth";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  fisioterapeuta: "Fisioterapeuta",
  avaliador: "Avaliador / Voluntário",
  recepcao: "Recepção",
};

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  fisioterapeuta: Stethoscope,
  avaliador: HeartHandshake,
  recepcao: Users,
};

export function NavUser({
  user: userProp,
}: {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { user: authUser, setRole } = useAuth();

  const name = userProp?.name || authUser?.name || "Usuário";
  const email = userProp?.email || authUser?.email || "usuario@conectasaude.org";
  const role = authUser?.role || "admin";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "CS";

  const RoleIcon = roleIcons[role] || Shield;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-border">
                {userProp?.avatar ? (
                  <AvatarImage src={userProp.avatar} alt={name} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-primary/20 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-foreground">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabels[role]}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-border">
                  <AvatarFallback className="rounded-lg bg-primary/20 text-xs font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Alternar Perfil de Acesso */}
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Perfil de Acesso
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {(["admin", "fisioterapeuta", "avaliador", "recepcao"] as UserRole[]).map((r) => {
                const Icon = roleIcons[r];
                const isSelected = role === r;
                return (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex items-center justify-between text-xs cursor-pointer ${
                      isSelected ? "bg-accent/70 font-semibold text-accent-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span>{roleLabels[r]}</span>
                    </div>
                    {isSelected && <UserCheck className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/configuracao" className="flex items-center gap-2 cursor-pointer text-xs">
                  <Settings className="size-3.5 text-muted-foreground" />
                  <span>Configurações do Sistema</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
