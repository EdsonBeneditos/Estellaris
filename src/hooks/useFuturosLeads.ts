import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuturoLead {
  id: string;
  empresa: string | null;
  cnpj: string | null;
  nome_contato: string | null;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  observacoes: string | null;
  data_prevista_contato: string;
  created_at: string;
  updated_at: string;
}

export function useFuturosLeads() {
  return useQuery({
    queryKey: ["futuros-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("futuros_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FuturoLead[];
    },
  });
}

export function useCreateFuturoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FuturoLead, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("futuros_leads")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futuros-leads"] });
    },
  });
}

export function useUpdateFuturoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FuturoLead> }) => {
      const { error } = await supabase
        .from("futuros_leads")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futuros-leads"] });
    },
  });
}

export function useDeleteFuturoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("futuros_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futuros-leads"] });
    },
  });
}

// Hook to convert a future lead to an active lead
export function useConvertToActiveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (futuroLead: FuturoLead) => {
      // Create active lead with all mapped fields including meio_contato
      const { error: createError } = await supabase.from("leads").insert({
        empresa: futuroLead.empresa,
        cnpj: futuroLead.cnpj,
        nome_contato: futuroLead.nome_contato,
        telefone: futuroLead.telefone,
        email: futuroLead.email,
        origem: futuroLead.origem,
        status: "Novo",
        // Default meio_contato based on available contact info
        meio_contato: futuroLead.telefone ? "Telefone" : (futuroLead.email ? "E-mail" : null),
      });
      
      if (createError) throw createError;

      // Delete future lead
      const { error: deleteError } = await supabase
        .from("futuros_leads")
        .delete()
        .eq("id", futuroLead.id);
      
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futuros-leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
