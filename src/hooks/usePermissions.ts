import { useAuthContext } from "@/contexts/AuthContext";
import { useCurrentUserRoles, useCurrentProfile } from "@/hooks/useOrganization";

// Menus disponíveis que podem ter permissão controlada
export const MENU_KEYS = [
  "dashboard",
  "leads",
  "futuros_leads",
  "clientes",
  "colaboradores",
  "estoque",
  "orcamentos",
  "notas_fiscais",
  "financeiro",
  "relatorios",
  "equipe",
  "configuracoes",
] as const;

export type MenuKey = typeof MENU_KEYS[number];

export function usePermissions() {
  const { user } = useAuthContext();
  const { data: roles = [] } = useCurrentUserRoles();
  const { data: profile } = useCurrentProfile();

  const userEmail = user?.email?.toLowerCase() || "";

  // Verifica se é administrador da organização (baseado em roles do banco)
  const isAdmin = roles.some((r) => r.role === "admin");

  // Verifica se é gerente
  const isGerente = roles.some((r) => r.role === "gerente");

  // Verifica se é super admin
  const isSuperAdmin = profile?.is_super_admin === true;

  // Verifica se pode acessar o sistema (tem perfil vinculado)
  const canAccessSystem = !!profile;

  // Verifica se pode ver o menu de configurações (admin ou gerente)
  const canViewSettings = isAdmin || isGerente;

  // Verifica se pode gerenciar equipe (apenas admin)
  const canManageTeam = isAdmin;

  // Verifica se pode excluir leads (admin ou gerente)
  const canDeleteLeads = isAdmin || isGerente;

  // Organization ID do usuário
  const organizationId = profile?.organization_id || null;

  // Permissões de menu por usuário (apenas para não-admins)
  // Admin e super admin têm acesso irrestrito
  const menuPermissions: string[] | null = profile?.menu_permissions ?? null;

  /**
   * Verifica se o usuário tem acesso a um menu específico.
   * - Admin e super admin: sempre têm acesso
   * - Outros usuários: verificam menu_permissions; se null → sem restrições configuradas → acesso liberado
   */
  const hasMenuAccess = (menuKey: string): boolean => {
    if (isAdmin || isSuperAdmin) return true;
    if (menuPermissions === null) return true; // nenhuma restrição configurada
    return menuPermissions.includes(menuKey);
  };

  return {
    isAdmin,
    isGerente,
    isSuperAdmin,
    canAccessSystem,
    canViewSettings,
    canManageTeam,
    canDeleteLeads,
    userEmail,
    organizationId,
    menuPermissions,
    hasMenuAccess,
  };
}
