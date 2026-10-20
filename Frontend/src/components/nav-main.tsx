import { useState, useEffect } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string | number;
  items?: {
    title: string;
    url: string;
    badge?: string | number;
  }[];
}

export function NavMain({
  items,
  label = "Menu Principal",
}: {
  items: NavItem[];
  label?: string;
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavMainItem({ item }: { item: NavItem }) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { setOpenMobile, isMobile } = useSidebar();

  const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

  const isSubItemActive = (subUrl: string) => {
    if (subUrl === "/" && pathname === "/") return true;
    if (subUrl !== "/" && (pathname === subUrl || pathname.startsWith(subUrl + "/"))) return true;
    return false;
  };

  const isAnySubItemActive = item.items?.some((subItem) => isSubItemActive(subItem.url)) || false;

  const [isOpen, setIsOpen] = useState(isAnySubItemActive || !!item.isActive);

  useEffect(() => {
    if (isAnySubItemActive) {
      setIsOpen(true);
    }
  }, [pathname, isAnySubItemActive]);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const buttonContent = (
    <>
      {item.icon && <item.icon className="size-4 shrink-0" />}
      <span className="truncate">{item.title}</span>
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {item.badge}
        </span>
      )}
    </>
  );

  // Link direto sem sub-itens
  if (!hasSubItems) {
    const isUrlActive =
      item.url === "/"
        ? pathname === "/"
        : pathname === item.url || pathname.startsWith(item.url + "/");
    const isActive = isUrlActive || !!item.isActive;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={isActive}
          className="transition-colors"
        >
          <Link to={item.url} onClick={handleLinkClick}>
            {buttonContent}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Item com sub-itens colapsáveis (como no projeto do Biotério)
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      asChild
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isAnySubItemActive}
            className="transition-colors"
          >
            {item.icon && <item.icon className="size-4 shrink-0" />}
            <span className="truncate">{item.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => {
              const subActive = isSubItemActive(subItem.url);
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={subActive}>
                    <Link to={subItem.url} onClick={handleLinkClick}>
                      <span className="truncate">{subItem.title}</span>
                      {subItem.badge !== undefined && (
                        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
