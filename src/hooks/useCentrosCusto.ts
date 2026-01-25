import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CentroCusto {
  id: string;
  nome: string;
  organization_id: string | null;
  created_at: string | null;
}

export function useCentrosCusto() {
  return useQuery({
    queryKey: ["centros_custo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centros_custo")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as CentroCusto[];
    },
  });
}

export function useCreateCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      // Buscar organization_id do usuário atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .single();

      if (!profile?.organization_id) {
        throw new Error("Organização não encontrada");
      }

      const { data, error } = await supabase
        .from("centros_custo")
        .insert({
          nome,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros_custo"] });
    },
  });
}

export function useUpdateCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("centros_custo")
        .update({ nome })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros_custo"] });
    },
  });
}

export function useDeleteCentroCusto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("centros_custo")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros_custo"] });
    },
  });
}
