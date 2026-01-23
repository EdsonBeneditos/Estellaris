import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: "Entrada" | "Saída";
  ativo: boolean;
  created_at: string;
}

export interface MovimentacaoCaixa {
  id: string;
  tipo: "Entrada" | "Saída";
  valor: number;
  categoria_id: string | null;
  categoria_nome: string | null;
  forma_pagamento: string;
  descricao: string | null;
  data_hora: string;
  usuario_email: string | null;
  realizado_por: string | null;
  orcamento_id: string | null;
  caixa_id: string | null;
  created_at: string;
}

export interface Caixa {
  id: string;
  data_abertura: string;
  data_fechamento: string | null;
  saldo_inicial: number;
  saldo_final: number | null;
  saldo_sistema: number | null;
  diferenca: number | null;
  usuario_abertura: string;
  usuario_fechamento: string | null;
  observacoes: string | null;
  status: "Aberto" | "Fechado";
  created_at: string;
}

// Hook para categorias financeiras
export function useCategorias() {
  return useQuery({
    queryKey: ["categorias_financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativo", true)
        .order("tipo", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
}

// Hook para movimentações
export function useMovimentacoes(filtros?: {
  dataInicio?: string;
  dataFim?: string;
  formaPagamento?: string;
  tipo?: string;
}) {
  return useQuery({
    queryKey: ["movimentacoes_caixa", filtros],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes_caixa")
        .select("*")
        .order("data_hora", { ascending: false });

      if (filtros?.dataInicio) {
        query = query.gte("data_hora", filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte("data_hora", filtros.dataFim + "T23:59:59");
      }
      if (filtros?.formaPagamento && filtros.formaPagamento !== "todos") {
        query = query.eq("forma_pagamento", filtros.formaPagamento);
      }
      if (filtros?.tipo && filtros.tipo !== "todos") {
        query = query.eq("tipo", filtros.tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
  });
}

// Hook para caixa aberto
export function useCaixaAberto() {
  return useQuery({
    queryKey: ["caixa_aberto"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "Aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Caixa | null;
    },
  });
}

// Hook para histórico de caixas
export function useHistoricoCaixas() {
  return useQuery({
    queryKey: ["historico_caixas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .order("data_abertura", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as Caixa[];
    },
  });
}

// Mutations
export function useCreateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movimentacao: Omit<MovimentacaoCaixa, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .insert(movimentacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
      toast.success("Movimentação registrada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao registrar movimentação", { description: error.message });
    },
  });
}

export function useUpdateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...movimentacao }: Partial<MovimentacaoCaixa> & { id: string }) => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .update(movimentacao)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
      toast.success("Movimentação atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar movimentação", { description: error.message });
    },
  });
}

export function useDeleteMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("movimentacoes_caixa")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
      toast.success("Movimentação excluída com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir movimentação", { description: error.message });
    },
  });
}

export function useAbrirCaixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ saldo_inicial, usuario_abertura }: { saldo_inicial: number; usuario_abertura: string }) => {
      const { data, error } = await supabase
        .from("caixas")
        .insert({
          saldo_inicial,
          usuario_abertura,
          status: "Aberto",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa_aberto"] });
      queryClient.invalidateQueries({ queryKey: ["historico_caixas"] });
      toast.success("Caixa aberto com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao abrir caixa", { description: error.message });
    },
  });
}

export function useFecharCaixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      saldo_final,
      saldo_sistema,
      usuario_fechamento,
      observacoes,
    }: {
      id: string;
      saldo_final: number;
      saldo_sistema: number;
      usuario_fechamento: string;
      observacoes?: string;
    }) => {
      const diferenca = saldo_final - saldo_sistema;

      const { data, error } = await supabase
        .from("caixas")
        .update({
          saldo_final,
          saldo_sistema,
          diferenca,
          usuario_fechamento,
          observacoes,
          status: "Fechado",
          data_fechamento: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa_aberto"] });
      queryClient.invalidateQueries({ queryKey: ["historico_caixas"] });
      toast.success("Caixa fechado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao fechar caixa", { description: error.message });
    },
  });
}

// Hook para calcular totais
export function useTotaisMovimentacoes(movimentacoes: MovimentacaoCaixa[] | undefined) {
  if (!movimentacoes) {
    return {
      totalEntradas: 0,
      totalSaidas: 0,
      saldoLiquido: 0,
      porFormaPagamento: {} as Record<string, number>,
    };
  }

  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === "Entrada")
    .reduce((acc, m) => acc + Number(m.valor), 0);

  const totalSaidas = movimentacoes
    .filter((m) => m.tipo === "Saída")
    .reduce((acc, m) => acc + Number(m.valor), 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  const porFormaPagamento = movimentacoes
    .filter((m) => m.tipo === "Entrada")
    .reduce((acc, m) => {
      const forma = m.forma_pagamento;
      acc[forma] = (acc[forma] || 0) + Number(m.valor);
      return acc;
    }, {} as Record<string, number>);

  return {
    totalEntradas,
    totalSaidas,
    saldoLiquido,
    porFormaPagamento,
  };
}
