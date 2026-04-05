import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

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
      // Super admins need to use a service role or RPC for this
      // For now, we'll fetch what RLS allows
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
      responsavel_nome?: string;
      responsavel_email?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("create-organization", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      organizationId: string;
      role: "admin" | "gerente" | "vendedor";
      nome?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("invite-user", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      nome: string;
      organization_id?: string; // required for super admin, omit for org admin (backend uses caller's org)
      role: "admin" | "gerente" | "vendedor";
    }) => {
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: data,
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
