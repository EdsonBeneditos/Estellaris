import { useCurrentOrganization, useCurrentUserRoles, useCurrentProfile } from "@/hooks/useOrganization";

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
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();

  const isLoading = orgLoading || rolesLoading || profileLoading;
  const isAdmin = roles.some((r) => r.role === "admin");

  const checkAccess = (): { allowed: boolean; reason?: string; settings?: AccessControlSettings } => {
    // Admins always have access
    if (isAdmin) {
      return { allowed: true };
    }

    // Check profile-level (individual) restrictions first
    if (profile) {
      const profileDias = profile.dias_acesso as string[] | null;
      const profileInicio = (profile as any).horario_inicio;
      const profileFim = (profile as any).horario_fim;

      if (profileDias && profileDias.length > 0 && profileInicio && profileFim) {
        const now = new Date();
        const currentDay = DAY_MAP[now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5);

        const settings: AccessControlSettings = {
          horaInicioAcesso: profileInicio,
          horaFimAcesso: profileFim,
          diasAcesso: profileDias,
        };

        if (!profileDias.includes(currentDay)) {
          return { allowed: false, reason: "day", settings };
        }

        const inicio = String(profileInicio).slice(0, 5);
        const fim = String(profileFim).slice(0, 5);
        if (currentTime < inicio || currentTime > fim) {
          return { allowed: false, reason: "time", settings };
        }

        return { allowed: true };
      }
    }

    // Fallback to organization-level restrictions
    if (!organization) {
      return { allowed: true };
    }

    const horaInicio = (organization as any).hora_inicio_acesso;
    const horaFim = (organization as any).hora_fim_acesso;
    const diasAcesso = (organization as any).dias_acesso as string[] | null;

    if (!horaInicio || !horaFim || !diasAcesso || diasAcesso.length === 0) {
      return { allowed: true };
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    const settings: AccessControlSettings = {
      horaInicioAcesso: horaInicio,
      horaFimAcesso: horaFim,
      diasAcesso: diasAcesso,
    };

    if (!diasAcesso.includes(currentDay)) {
      return { allowed: false, reason: "day", settings };
    }

    if (currentTime < horaInicio.slice(0, 5) || currentTime > horaFim.slice(0, 5)) {
      return { allowed: false, reason: "time", settings };
    }

    return { allowed: true };
  };

  return {
    isLoading,
    isAdmin,
    ...checkAccess(),
  };
}
