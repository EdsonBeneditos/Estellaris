import { useCurrentOrganization, useCurrentUserRoles } from "@/hooks/useOrganization";

const DAY_MAP: Record<number, string> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sab",
};

export interface AccessControlSettings {
  horaInicioAcesso: string;
  horaFimAcesso: string;
  diasAcesso: string[];
}

export function useAccessControl() {
  const { data: organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: roles = [], isLoading: rolesLoading } = useCurrentUserRoles();

  const isLoading = orgLoading || rolesLoading;
  const isAdmin = roles.some((r) => r.role === "admin");

  const checkAccess = (): { allowed: boolean; reason?: string; settings?: AccessControlSettings } => {
    // Admins always have access
    if (isAdmin) {
      return { allowed: true };
    }

    if (!organization) {
      return { allowed: true }; // Allow if no org data yet
    }

    const horaInicio = (organization as any).hora_inicio_acesso;
    const horaFim = (organization as any).hora_fim_acesso;
    const diasAcesso = (organization as any).dias_acesso as string[] | null;

    // If no restrictions set, allow access
    if (!horaInicio || !horaFim || !diasAcesso || diasAcesso.length === 0) {
      return { allowed: true };
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const settings: AccessControlSettings = {
      horaInicioAcesso: horaInicio,
      horaFimAcesso: horaFim,
      diasAcesso: diasAcesso,
    };

    // Check day
    if (!diasAcesso.includes(currentDay)) {
      return { 
        allowed: false, 
        reason: "day",
        settings,
      };
    }

    // Check time (compare as strings works for HH:MM format)
    if (currentTime < horaInicio.slice(0, 5) || currentTime > horaFim.slice(0, 5)) {
      return { 
        allowed: false, 
        reason: "time",
        settings,
      };
    }

    return { allowed: true };
  };

  return {
    isLoading,
    isAdmin,
    ...checkAccess(),
  };
}
