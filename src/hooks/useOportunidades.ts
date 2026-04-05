import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";

export interface OportunidadeItem {
  produto_id: string;
  produto_nome: string;
  produto_sku: string;
  unidade_medida: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Oportunidade {
  id: string;
  lead_id: string;
  organization_id: string;
  titulo: string;
  descricao: string | null;
  valor_estimado: number;
  status: "Aberta" | "Proposta Enviada" | "Em Negociação" | "Ganha" | "Perdida";
  motivo_perda: string | null;
  data_fechamento: string | null;
  vendedor: string | null;
  itens: OportunidadeItem[];
  created_at: string;
  updated_at: string;
}

/** Lead status → Oportunidade status mapping */
export const LEAD_STATUS_TO_OP: Record<string, Oportunidade["status"] | null> = {
  "Novo": "Aberta",
  "Em Contato": "Proposta Enviada",
  "Qualificado": "Em Negociação",
  "Proposta Enviada": "Proposta Enviada",
  "Negociação": "Em Negociação",
  "Convertido": "Ganha",
  "Perdido": "Perdida",
};

// Cast helper — table may not be in generated types yet
const db = () => supabase as any;

/** Oportunidades for a single lead */
export function useOportunidades(leadId: string | null | undefined) {
  return useQuery({
    queryKey: ["oportunidades", leadId],
    queryFn: async () => {
      if (!leadId) return [] as Oportunidade[];
      const { data, error } = await db()
        .from("oportunidades")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Oportunidade[];
    },
    enabled: !!leadId,
  });
}

/** All oportunidades — used by reports */
export function useAllOportunidades() {
  return useQuery({
    queryKey: ["all-oportunidades"],
    queryFn: async () => {
      const { data, error } = await db()
        .from("oportunidades")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Oportunidade[];
    },
  });
}

export function useCreateOportunidade() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (payload: {
      lead_id: string;
      titulo: string;
      descricao?: string | null;
      valor_estimado?: number;
      vendedor?: string | null;
      itens?: OportunidadeItem[];
    }) => {
      const { data, error } = await db()
        .from("oportunidades")
        .insert({
          ...payload,
          organization_id: profile?.organization_id,
          status: "Aberta",
          valor_estimado: payload.valor_estimado ?? 0,
          itens: payload.itens ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as Oportunidade;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["oportunidades", data.lead_id] });
      queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });
    },
  });
}

export function useUpdateOportunidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: patch,
    }: {
      id: string;
      data: Partial<Omit<Oportunidade, "id" | "organization_id" | "created_at" | "updated_at">>;
    }) => {
      const updatePayload: any = { ...patch };

      // Auto-set data_fechamento when closing
      if (
        (patch.status === "Ganha" || patch.status === "Perdida") &&
        !updatePayload.data_fechamento
      ) {
        updatePayload.data_fechamento = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await db()
        .from("oportunidades")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Oportunidade;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["oportunidades", data.lead_id] });
      queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });
    },
  });
}

export function useDeleteOportunidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await db()
        .from("oportunidades")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: ["oportunidades", leadId] });
      queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });
    },
  });
}
