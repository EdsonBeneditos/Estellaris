import { LayoutDashboard, Users, BarChart3, Settings, LogOut, UserPlus, Package, FileText, Receipt, Wallet, UsersRound, Building2, Shield, HardHat } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsSuperAdmin } from "@/hooks/useSuperAdmin";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { isModuleEnabled, hasAnyReport, ModuleKey } from "@/lib/modules";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Mapeamento de módulo para item de menu
const moduleMenuItems: Record<ModuleKey, { title: string; url: string; icon: React.ElementType } | null> = {
  dashboard: { title: "Dashboard", url: "/", icon: LayoutDashboard },
  leads: { title: "Leads", url: "/leads", icon: Users },
  futuros_leads: { title: "Futuros Leads", url: "/futuros-leads", icon: UserPlus },
  clientes: { title: "Clientes", url: "/clientes", icon: Building2 },
  colaboradores: { title: "Colaboradores", url: "/colaboradores", icon: HardHat },
  estoque: { title: "Estoque", url: "/estoque", icon: Package },
  orcamentos: { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  notas_fiscais: { title: "Notas Fiscais", url: "/notas-fiscais", icon: Receipt },
  financeiro: { title: "Financeiro", url: "/financeiro", icon: Wallet },
  relatorios_leads: null, // Tratado separadamente
  relatorios_financeiro: null, // Tratado separadamente
  configuracoes: { title: "Configurações", url: "/configuracoes", icon: Settings },
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuthContext();
  const { canViewSettings, canManageTeam } = usePermissions();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { data: organization } = useCurrentOrganization();

  const isActive = (path: string) => location.pathname === path;

  const enabledModules = organization?.modules_enabled;

  // Construir menu baseado nos módulos habilitados
  const menuItems: { title: string; url: string; icon: React.ElementType }[] = [];

  // Adicionar itens baseados nos módulos habilitados
  (Object.keys(moduleMenuItems) as ModuleKey[]).forEach((moduleKey) => {
    const menuItem = moduleMenuItems[moduleKey];
    if (!menuItem) return; // Pular relatórios (tratados separadamente)
    
    // Configurações requer permissão adicional
    if (moduleKey === "configuracoes") {
      if (canViewSettings && isModuleEnabled(enabledModules, moduleKey)) {
        menuItems.push(menuItem);
      }
      return;
    }
    
    if (isModuleEnabled(enabledModules, moduleKey)) {
      menuItems.push(menuItem);
    }
  });

  // Adicionar Relatórios se algum estiver habilitado
  const reportStatus = hasAnyReport(enabledModules);
  if (reportStatus.hasAny) {
    menuItems.push({ title: "Relatórios", url: "/relatorios", icon: BarChart3 });
  }

  // Adicionar Equipe se tiver permissão
  if (canManageTeam) {
    menuItems.push({ title: "Equipe", url: "/equipe", icon: UsersRound });
  }

  // Adicionar Super Admin se for super admin
  if (isSuperAdmin) {
    menuItems.push({ title: "Super Admin", url: "/super-admin", icon: Shield });
  }

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair", { description: error.message });
    } else {
      toast.success("Você saiu do sistema");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border transition-all duration-300">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110">
            <span className="text-sm font-bold text-primary">CRM</span>
          </div>
          <span className="font-semibold text-foreground group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            Meu CRM
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:translate-x-1"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200" />
                      <span className="transition-opacity duration-200">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <div className="flex flex-col gap-2">
          {!collapsed && user && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
