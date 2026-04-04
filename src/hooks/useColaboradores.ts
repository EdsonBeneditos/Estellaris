import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ColaboradorHistorico {
  id: string;
  colaborador_id: string;
  tipo: string;
  descricao: string;
  data_evento: string;
  registrado_por_email: string | null;
  created_at: string;
}

export async function registrarHistoricoColaborador(
  organizationId: string,
  colaboradorId: string,
  tipo: string,
  descricao: string,
  dataEvento: string
) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("colaboradores_historico").insert({
    organization_id: organizationId,
    colaborador_id: colaboradorId,
    tipo,
    descricao,
    data_evento: dataEvento,
    registrado_por_email: userData.user?.email ?? null,
  });
  if (error) console.error("Erro ao registrar histórico:", error);
}

export function useColaboradorHistorico(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["colaborador-historico", colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return [];
      const { data, error } = await supabase
        .from("colaboradores_historico")
        .select("*")
        .eq("colaborador_id", colaboradorId)
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data as ColaboradorHistorico[];
    },
    enabled: !!colaboradorId,
  });
}

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
  tipo_contrato: string | null;
  beneficios: string[] | null;
  cnh_tipos: string[] | null;
  pcd: boolean | null;
  troca_turno: boolean | null;
  preferencia_turno: string | null;
  email_pessoal: string | null;
  telefone: string | null;
  data_ultima_ferias: string | null;
  data_retorno_ferias: string | null;
  cep: string | null;
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  numero_endereco: string | null;
  complemento: string | null;
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
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("status", "Ativo")
        .not("data_admissao", "is", null)
        .order("data_admissao");

      if (error) throw error;
      const all = data as Colaborador[];

      // Only show alert if the colaborador is near or past 11 months since
      // their last vacation return (or admission if never took vacation).
      return all.filter((c) => {
        const referenceDate = c.data_retorno_ferias || c.data_admissao;
        if (!referenceDate) return false;
        const months = calculateMonthsSinceDate(referenceDate);
        return months >= 11;
      });
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

// Generic: months since any date
export function calculateMonthsSinceDate(date: string | null): number {
  if (!date) return 0;
  const ref = new Date(date);
  const now = new Date();
  return (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth());
}

// Legacy alias (keep for backwards compat)
export function calculateMonthsSinceAdmission(dataAdmissao: string | null): number {
  return calculateMonthsSinceDate(dataAdmissao);
}

// Check if employee is near vacation eligibility based on return date or admission
export function isNearVacation(colaborador: Pick<Colaborador, "data_admissao" | "data_retorno_ferias">): boolean {
  const referenceDate = colaborador.data_retorno_ferias || colaborador.data_admissao;
  const months = calculateMonthsSinceDate(referenceDate);
  return months >= 11;
}
