import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { type NavItem, NavMainItem } from "./nav-main";

export function NavAdmin({
  menus,
  label = "Administração",
}: {
  menus: NavItem[];
  label?: string;
}) {
  if (!menus || menus.length === 0) return null;

  return (
    <SidebarGroup className="py-2">
      <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-sidebar-foreground/80 mb-1 px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
        {menus.map((item) => (
          <NavMainItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
