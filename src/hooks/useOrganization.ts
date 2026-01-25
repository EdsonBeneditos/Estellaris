import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface Organization {
  id: string;
  nome: string;
  cnpj: string | null;
  plano: "Basico" | "Pro" | "Enterprise";
  ativo: boolean;
  modules_enabled: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  is_super_admin: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "gerente" | "vendedor";
  created_at: string;
}

// Hook para obter a organização do usuário atual
export function useCurrentOrganization() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["current-organization", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Primeiro buscar o perfil do usuário para obter o organization_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) return null;

      // Depois buscar a organização
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (orgError) throw orgError;
      return org as Organization;
    },
    enabled: !!user?.id,
  });
}

// Hook para obter o perfil do usuário atual
export function useCurrentProfile() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Se não existir perfil, retornar null
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as Profile;
    },
    enabled: !!user?.id,
  });
}

// Hook para obter as roles do usuário atual
export function useCurrentUserRoles() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["current-user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user?.id,
  });
}

// Hook para verificar se o usuário é admin da organização
export function useIsOrgAdmin() {
  const { data: roles = [] } = useCurrentUserRoles();
  return roles.some((r) => r.role === "admin");
}

// Hook para obter todos os membros da organização (apenas para admins)
export function useOrganizationMembers() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["organization-members", user?.id],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");

      if (profilesError) throw profilesError;

      // Buscar roles de todos os usuários da organização
      const userIds = profiles.map((p) => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Combinar perfis com roles
      return profiles.map((profile) => ({
        ...profile,
        roles: roles.filter((r) => r.user_id === profile.id),
      })) as (Profile & { roles: UserRole[] })[];
    },
    enabled: !!user?.id,
  });
}

// Hook para atualizar a organização
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Organization>;
    }) => {
      const { error } = await supabase
        .from("organizations")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-organization"] });
    },
  });
}

// Hook para atualizar role de um usuário
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "gerente" | "vendedor";
    }) => {
      // Primeiro deletar roles existentes
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Depois inserir nova role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-roles"] });
    },
  });
}

// Hook para remover um membro da organização
export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Deletar o perfil (cascade vai deletar roles)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    },
  });
}
