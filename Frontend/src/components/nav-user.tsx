import {
  ChevronsUpDown,
  Settings,
  LogOut,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export function NavUser({
  user: userProp,
}: {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Se não estiver autenticado, exibe botão direto de Login
  if (!isAuthenticated || !authUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            size="lg"
            className="hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            <Link to="/login" className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <LogIn className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-foreground">Acessar Conta</span>
                <span className="text-xs text-muted-foreground">Fazer login</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const name = authUser.name || userProp?.name || "Usuário";
  const email = authUser.email || userProp?.email || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "US";

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
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-foreground">{name}</span>
                  {isAdmin && (
                    <Badge variant="outline" className="px-1.5 py-0 text-xs bg-primary/10 text-primary border-primary/20">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground flex items-center gap-1">
                  {authUser?.username ? (
                    <span>@{authUser.username}</span>
                  ) : (
                    <span>{email}</span>
                  )}
                </div>
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
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{name}</span>
                    {isAdmin && (
                      <Badge variant="outline" className="px-1.5 py-0 text-xs bg-primary/10 text-primary border-primary/20">
                        Admin
                      </Badge>
                    )}
                  </div>
                  {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/administrador" className="flex items-center gap-2 cursor-pointer text-sm">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Painel do Administrador</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link to="/configuracao" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Settings className="size-4 text-muted-foreground" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sair da Conta (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
