import { useAuthContext } from "@/contexts/AuthContext";

// E-mails dos administradores do sistema
const ADMIN_EMAILS = [
  "bene.edsonsilva@gmail.com",
  "guilherme.marcuschi@acquanobilis.com.br",
];

// E-mails que podem acessar todas as funcionalidades (admins + SDR)
const ALL_USERS_EMAILS = [
  ...ADMIN_EMAILS,
  "luana.castro@acquanobilis.com.br",
];

export function usePermissions() {
  const { user } = useAuthContext();
  
  const userEmail = user?.email?.toLowerCase() || "";
  
  // Verifica se é administrador (pode ver configurações, excluir leads, etc.)
  const isAdmin = ADMIN_EMAILS.some(
    (email) => email.toLowerCase() === userEmail
  );
  
  // Verifica se pode acessar o sistema
  const canAccessSystem = ALL_USERS_EMAILS.some(
    (email) => email.toLowerCase() === userEmail
  );
  
  // Verifica se pode ver o menu de configurações
  const canViewSettings = isAdmin;
  
  // Verifica se pode excluir leads
  const canDeleteLeads = isAdmin;
  
  return {
    isAdmin,
    canAccessSystem,
    canViewSettings,
    canDeleteLeads,
    userEmail,
  };
}
