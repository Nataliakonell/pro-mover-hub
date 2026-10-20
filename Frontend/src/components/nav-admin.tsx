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
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {menus.map((item) => (
          <NavMainItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
