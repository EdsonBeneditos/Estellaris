import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Colaborador {
  id: string;
  organization_id: string | null;
  codigo_cadastro: string | null;
  nome: string;
  cargo: string | null;
  turno: string | null;
  data_admissao: string | null;
  status: string | null;
  tipo_carteira: string | null;
  cnh_tipos: string[] | null;
  pcd: boolean | null;
  troca_turno: boolean | null;
  preferencia_turno: string | null;
  email_pessoal: string | null;
  telefone: string | null;
  created_at: string | null;
}

export type ColaboradorInput = Omit<Colaborador, "id" | "created_at">;

export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useColaboradoresProximosFerias() {
  return useQuery({
    queryKey: ["colaboradores-proximos-ferias"],
    queryFn: async () => {
      const elevenMonthsAgo = new Date();
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
      
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("status", "Ativo")
        .lte("data_admissao", elevenMonthsAgo.toISOString().split("T")[0])
        .order("data_admissao");

      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ColaboradorInput) => {
      const { data: result, error } = await supabase
        .from("colaboradores")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-proximos-ferias"] });
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Colaborador> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("colaboradores")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-proximos-ferias"] });
    },
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores-proximos-ferias"] });
    },
  });
}

// Utility function to calculate months since admission
export function calculateMonthsSinceAdmission(dataAdmissao: string | null): number {
  if (!dataAdmissao) return 0;
  
  const admission = new Date(dataAdmissao);
  const now = new Date();
  
  const months = (now.getFullYear() - admission.getFullYear()) * 12 
    + (now.getMonth() - admission.getMonth());
  
  return months;
}

// Check if employee is near vacation eligibility (11+ months)
export function isNearVacation(dataAdmissao: string | null): boolean {
  const months = calculateMonthsSinceAdmission(dataAdmissao);
  return months >= 11 && months < 12;
}
