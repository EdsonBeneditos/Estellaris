import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { toast } from "sonner";

export function useIsSuperAdmin() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (error) return false;
      return data?.is_super_admin === true;
    },
    enabled: !!user?.id,
  });
}

export function useAllOrganizations() {
  const { data: isSuperAdmin } = useIsSuperAdmin();

  return useQuery({
    queryKey: ["all-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin === true,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      cnpj?: string;
      plano?: string;
      modules_enabled?: string[];
    }) => {
      // Insert org directly — no Edge Function needed
      const { data: org, error } = await supabase
        .from("organizations")
        .insert({
          nome: data.nome,
          cnpj: data.cnpj || null,
          plano: data.plano || "Basico",
          modules_enabled: data.modules_enabled || [],
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { organization: org, message: `Organização "${data.nome}" criada com sucesso!` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
    },
  });
}

// Legacy — kept for compatibility but no longer used
export function useInviteUser() {
  return useMutation({
    mutationFn: async (_data: {
      email: string;
      organizationId: string;
      role: "admin" | "gerente" | "vendedor";
      nome?: string;
    }) => {
      throw new Error("Use useCreateUser em vez de useInviteUser");
    },
  });
}

/** Generate a URL-safe id_nome from a full name */
function toIdNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "")
    .slice(0, 40);
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      nome: string;
      organization_id?: string;
      role: "admin" | "gerente" | "vendedor";
    }) => {
      const orgId = data.organization_id ?? profile?.organization_id;
      if (!orgId) throw new Error("Organização não encontrada");

      const idNome = toIdNome(data.nome);

      const db = supabase as any;
      const { data: result, error } = await db.rpc("admin_create_user", {
        p_email: data.email,
        p_password: data.password,
        p_nome: data.nome,
        p_organization_id: orgId,
        p_role: data.role,
        p_id_nome: idNome,
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result as {
        success: boolean;
        userId: string;
        email: string;
        nome: string;
        id_nome: string;
        role: string;
        organization_id: string;
        message: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    },
  });
}

/** Fetch all users (profiles) of a given organization */
export function useOrgUsers(organizationId: string | null) {
  return useQuery({
    queryKey: ["org-users", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, id_nome, organization_id")
        .eq("organization_id", organizationId)
        .order("nome");
      if (error) throw error;

      // Fetch roles separately from user_roles table
      const userIds = (data || []).map((u: any) => u.id);
      if (userIds.length === 0) return [];

      const db = supabase as any;
      const { data: roles } = await db
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => {
        roleMap[r.user_id] = r.role;
      });

      return (data || []).map((u: any) => ({
        ...u,
        role: roleMap[u.id] || "vendedor",
      }));
    },
    enabled: !!organizationId,
  });
}

/** Reset password for a user via RPC */
export function useAdminUpdatePassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const db = supabase as any;
      const { error } = await db.rpc("admin_update_password", {
        p_user_id: userId,
        p_new_password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar senha", { description: error.message });
    },
  });
}

/** Update user role */
export function useAdminUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
      organizationId,
    }: {
      userId: string;
      role: "admin" | "gerente" | "vendedor";
      organizationId: string;
    }) => {
      const db = supabase as any;
      const { error } = await db
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_v, vars) => {
      queryClient.invalidateQueries({ queryKey: ["org-users", vars.organizationId] });
      toast.success("Cargo atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar cargo", { description: error.message });
    },
  });
}
