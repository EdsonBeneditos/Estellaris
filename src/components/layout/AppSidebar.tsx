import { LayoutDashboard, Users, BarChart3, Settings, LogOut, UserPlus, Package, FileText, Receipt, Wallet, UsersRound, Building2, Shield, HardHat, Crown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsSuperAdmin } from "@/hooks/useSuperAdmin";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { isModuleEnabled, hasAnyReport, ModuleKey, AVAILABLE_MODULES } from "@/lib/modules";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePendingBudgetsCount } from "@/hooks/usePendingBudgets";
import { usePendingClientesCount } from "@/hooks/usePendingClientesCount";

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
  financeiro: { title: "Financeiro / Caixa", url: "/financeiro", icon: Wallet },
  relatorios_leads: null, // Tratado separadamente como "Relatórios"
  relatorios_financeiro: null, // Tratado separadamente como "Relatórios"
  equipe: { title: "Equipe", url: "/equipe", icon: UsersRound },
  configuracoes: { title: "Configurações", url: "/configuracoes", icon: Settings },
  super_admin: { title: "Super Admin", url: "/super-admin", icon: Shield },
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuthContext();
  const { canViewSettings, canManageTeam, isAdmin, hasMenuAccess } = usePermissions();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { data: organization } = useCurrentOrganization();
  const { data: pendingBudgets = 0 } = usePendingBudgetsCount();
  const { data: pendingClientes = 0 } = usePendingClientesCount();

  const isActive = (path: string) => location.pathname === path;

  const enabledModules = organization?.modules_enabled;

  // GOD MODE: Se for Super Admin, exibe TODOS os módulos incondicionalmente
  const isGodMode = isSuperAdmin === true;

  // Construir menu baseado nos módulos habilitados (ou todos se God Mode)
  const menuItems: { title: string; url: string; icon: React.ElementType }[] = [];

  // Módulos regulares (ordem de exibição)
  const regularModules: ModuleKey[] = [
    "dashboard",
    "leads",
    "futuros_leads",
    "clientes",
    "colaboradores",
    "estoque",
    "orcamentos",
    "notas_fiscais",
    "financeiro",
  ];

  if (isGodMode) {
    // GOD MODE: Adiciona TODOS os módulos regulares sem verificação
    regularModules.forEach((moduleKey) => {
      const menuItem = moduleMenuItems[moduleKey];
      if (menuItem) {
        menuItems.push(menuItem);
      }
    });

    // Sempre adiciona Relatórios no God Mode
    menuItems.push({ title: "Relatórios", url: "/relatorios", icon: BarChart3 });

    // Sempre adiciona Equipe no God Mode
    const equipeItem = moduleMenuItems.equipe;
    if (equipeItem) menuItems.push(equipeItem);

    // Sempre adiciona Configurações no God Mode
    const configItem = moduleMenuItems.configuracoes;
    if (configItem) menuItems.push(configItem);

    // Sempre adiciona Super Admin no God Mode
    const superAdminItem = moduleMenuItems.super_admin;
    if (superAdminItem) menuItems.push(superAdminItem);
  } else {
    // Modo normal: respeita modules_enabled, permissões e menu_permissions por usuário
    regularModules.forEach((moduleKey) => {
      const menuItem = moduleMenuItems[moduleKey];
      if (!menuItem || !isModuleEnabled(enabledModules, moduleKey)) return;
      // Financeiro: apenas admin ou quem tiver permissão explícita
      if (moduleKey === "financeiro" && !isAdmin && !hasMenuAccess("financeiro")) return;
      // Outros menus: verificar menu_permissions
      if (!hasMenuAccess(moduleKey)) return;
      menuItems.push(menuItem);
    });

    // Adicionar Relatórios se algum estiver habilitado e tiver acesso
    const reportStatus = hasAnyReport(enabledModules);
    if (reportStatus.hasAny && hasMenuAccess("relatorios")) {
      menuItems.push({ title: "Relatórios", url: "/relatorios", icon: BarChart3 });
    }

    // Adicionar Equipe se o módulo estiver habilitado E tiver permissão
    if (isModuleEnabled(enabledModules, "equipe") && canManageTeam && hasMenuAccess("equipe")) {
      const equipeItem = moduleMenuItems.equipe;
      if (equipeItem) menuItems.push(equipeItem);
    }

    // Adicionar Configurações se o módulo estiver habilitado E tiver permissão
    if (isModuleEnabled(enabledModules, "configuracoes") && canViewSettings && hasMenuAccess("configuracoes")) {
      const configItem = moduleMenuItems.configuracoes;
      if (configItem) menuItems.push(configItem);
    }
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
                      {item.url === "/financeiro" && pendingBudgets > 0 && (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground border-0 rounded-full">
                          {pendingBudgets}
                        </Badge>
                      )}
                      {item.url === "/clientes" && pendingClientes > 0 && (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-emerald-600 text-white border-0 rounded-full">
                          {pendingClientes}
                        </Badge>
                      )}
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
          {/* God Mode Indicator */}
          {isGodMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30">
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  {!collapsed && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      God Mode
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Acesso Total - Todos os módulos liberados</p>
              </TooltipContent>
            </Tooltip>
          )}

          {!collapsed && user && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate flex items-center gap-2">
              {isGodMode && <Shield className="h-3 w-3 text-amber-500 shrink-0" />}
              <span className="truncate">{user.email}</span>
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
