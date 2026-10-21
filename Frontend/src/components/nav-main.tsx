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
  search?: Record<string, string>;
  items?: {
    title: string;
    url: string;
    search?: Record<string, string>;
  }[];
}

export function NavMain({
  items,
  label = "Menus principais",
}: {
  items: NavItem[];
  label?: string;
}) {
  return (
    <SidebarGroup className="py-2">
      <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-sidebar-foreground/80 mb-1 px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
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
  const currentSearch = (routerState.location.search || {}) as Record<string, string>;
  const { setOpenMobile, isMobile } = useSidebar();

  const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

  const isSubItemActive = (subUrl: string, subSearch?: Record<string, string>) => {
    if (subUrl !== pathname) return false;
    if (subSearch?.tab) {
      const currentTab = (currentSearch.tab as string) || "visao-geral";
      return currentTab === subSearch.tab;
    }
    return true;
  };

  const isAnySubItemActive =
    item.items?.some((subItem) => isSubItemActive(subItem.url, subItem.search)) || false;

  const isUrlActive =
    item.url.startsWith("/") &&
    (pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url + "/")));
  const isActive = isUrlActive || (item.url === "/" && pathname === "/");

  const [isOpen, setIsOpen] = useState(isAnySubItemActive || !!item.isActive);

  useEffect(() => {
    if (isAnySubItemActive) {
      setIsOpen(true);
    }
  }, [pathname, routerState.location.searchStr, isAnySubItemActive]);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const buttonContent = (
    <>
      {item.icon && <item.icon className="size-5 shrink-0" />}
      <span className="text-sm sm:text-[15px] font-medium leading-none">{item.title}</span>
    </>
  );

  if (!hasSubItems) {
    const isLink = item.url && item.url.startsWith("/");

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={isActive}
          className="h-10 px-3 text-[15px] font-medium transition-colors"
        >
          {isLink ? (
            <Link
              to={item.url as any}
              search={item.search ? (item.search as any) : undefined}
              onClick={handleLinkClick}
            >
              {buttonContent}
            </Link>
          ) : (
            <a href={item.url} onClick={handleLinkClick}>
              {buttonContent}
            </a>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

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
            className="h-10 px-3 text-[15px] font-medium transition-colors"
          >
            {item.icon && <item.icon className="size-5 shrink-0" />}
            <span className="text-sm sm:text-[15px] font-medium leading-none">{item.title}</span>
            <ChevronRight className="ml-auto size-4.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="gap-1 my-1 pl-3.5 border-l-2">
            {item.items?.map((subItem) => {
              const subActive = isSubItemActive(subItem.url, subItem.search);
              const isSubLink = subItem.url && subItem.url.startsWith("/");
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={subActive}
                    className="h-8.5 px-2.5 text-sm transition-colors"
                  >
                    {isSubLink ? (
                      <Link
                        to={subItem.url as any}
                        search={subItem.search ? (subItem.search as any) : undefined}
                        onClick={handleLinkClick}
                      >
                        <span className="text-sm font-medium">{subItem.title}</span>
                      </Link>
                    ) : (
                      <a href={subItem.url} onClick={handleLinkClick}>
                        <span className="text-sm font-medium">{subItem.title}</span>
                      </a>
                    )}
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
