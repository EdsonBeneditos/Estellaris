import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentProfile } from "@/hooks/useOrganization";

export type Orcamento = {
  id: string;
  numero_orcamento: number;
  lead_id: string | null;
  cliente_nome: string | null;
  cliente_cnpj: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  cliente_endereco: string | null;
  status: string;
  status_financeiro: string | null;
  motivo_cancelamento: string | null;
  subtotal: number;
  desconto_total: number;
  valor_total: number;
  observacoes: string | null;
  validade_dias: number | null;
  data_validade: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  produto_id: string;
  produto_nome: string;
  produto_sku: string;
  unidade_medida: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual: number;
  desconto_valor: number;
  valor_total: number;
  organization_id: string | null;
  created_at: string;
};

export type OrcamentoInsert = Omit<Orcamento, 'id' | 'numero_orcamento' | 'created_at' | 'updated_at' | 'organization_id' | 'status_financeiro' | 'motivo_cancelamento'>;
export type OrcamentoItemInsert = Omit<OrcamentoItem, 'id' | 'created_at' | 'organization_id'>;

export const useOrcamentos = () => {
  return useQuery({
    queryKey: ["orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Orcamento[];
    },
  });
};

export const useOrcamento = (id: string | null) => {
  return useQuery({
    queryKey: ["orcamento", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Orcamento;
    },
    enabled: !!id,
  });
};

export const useOrcamentoItens = (orcamentoId: string | null) => {
  return useQuery({
    queryKey: ["orcamento-itens", orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return [];
      
      const { data, error } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamentoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as OrcamentoItem[];
    },
    enabled: !!orcamentoId,
  });
};

export const useCreateOrcamento = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: OrcamentoInsert) => {
      const { data: orcamento, error } = await supabase
        .from("orcamentos")
        .insert({ ...data, organization_id: profile?.organization_id })
        .select()
        .single();

      if (error) throw error;
      return orcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar orçamento: " + error.message);
    },
  });
};

export const useUpdateOrcamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Orcamento> }) => {
      const { data: orcamento, error } = await supabase
        .from("orcamentos")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return orcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["orcamento"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["pending_budgets_count"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
      toast.success("Orçamento atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar orçamento: " + error.message);
    },
  });
};

export const useDeleteOrcamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir orçamento: " + error.message);
    },
  });
};

export const useCreateOrcamentoItem = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: OrcamentoItemInsert) => {
      const { data: item, error } = await supabase
        .from("orcamento_itens")
        .insert({ ...data, organization_id: profile?.organization_id })
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento-itens", variables.orcamento_id] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar item: " + error.message);
    },
  });
};

export const useDeleteOrcamentoItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orcamentoId }: { id: string; orcamentoId: string }) => {
      const { error } = await supabase
        .from("orcamento_itens")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return orcamentoId;
    },
    onSuccess: (orcamentoId) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento-itens", orcamentoId] });
    },
    onError: (error) => {
      toast.error("Erro ao remover item: " + error.message);
    },
  });
};

export const useBulkCreateOrcamentoItens = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async ({ orcamentoId, items }: { orcamentoId: string; items: Omit<OrcamentoItemInsert, 'orcamento_id'>[] }) => {
      const itemsWithOrcamentoId = items.map(item => ({
        ...item,
        orcamento_id: orcamentoId,
        organization_id: profile?.organization_id,
      }));

      const { data, error } = await supabase
        .from("orcamento_itens")
        .insert(itemsWithOrcamentoId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento-itens", variables.orcamentoId] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar itens: " + error.message);
    },
  });
};
