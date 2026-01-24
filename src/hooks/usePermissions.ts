import { useAuthContext } from "@/contexts/AuthContext";
import { useCurrentUserRoles, useCurrentProfile } from "@/hooks/useOrganization";

export function usePermissions() {
  const { user } = useAuthContext();
  const { data: roles = [] } = useCurrentUserRoles();
  const { data: profile } = useCurrentProfile();
  
  const userEmail = user?.email?.toLowerCase() || "";
  
  // Verifica se é administrador da organização (baseado em roles do banco)
  const isAdmin = roles.some((r) => r.role === "admin");
  
  // Verifica se é gerente
  const isGerente = roles.some((r) => r.role === "gerente");
  
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
  
  return {
    isAdmin,
    isGerente,
    canAccessSystem,
    canViewSettings,
    canManageTeam,
    canDeleteLeads,
    userEmail,
    organizationId,
  };
}
