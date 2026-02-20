import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentProfile } from "@/hooks/useOrganization";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: "Entrada" | "Saída";
  ativo: boolean;
  organization_id: string | null;
  created_at: string;
}

export interface MovimentacaoCaixa {
  id: string;
  tipo: "Entrada" | "Saída";
  valor: number;
  categoria_id: string | null;
  categoria_nome: string | null;
  centro_custo_id: string | null;
  forma_pagamento: string;
  descricao: string | null;
  data_hora: string;
  data_movimentacao: string | null;
  usuario_email: string | null;
  realizado_por: string | null;
  autorizado_por: string | null;
  autorizado_por_email: string | null;
  orcamento_id: string | null;
  caixa_id: string | null;
  organization_id: string | null;
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
  organization_id: string | null;
  created_at: string;
}

export interface FechamentoCaixa {
  id: string;
  caixa_id: string;
  valor_dinheiro_contado: number;
  valor_pix_contado: number;
  valor_cartao_contado: number;
  valor_outros_contado: number;
  total_contado: number;
  valor_dinheiro_sistema: number;
  valor_pix_sistema: number;
  valor_cartao_sistema: number;
  valor_outros_sistema: number;
  total_sistema: number;
  diferenca_dinheiro: number;
  diferenca_pix: number;
  diferenca_cartao: number;
  diferenca_outros: number;
  diferenca_total: number;
  realizado_por: string | null;
  realizado_por_email: string | null;
  observacoes: string | null;
  organization_id: string | null;
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
  categoria?: string;
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
      if (filtros?.categoria && filtros.categoria !== "todos") {
        query = query.eq("categoria_id", filtros.categoria);
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

// Hook para fechamentos de caixa
export function useFechamentosCaixa(caixaId?: string) {
  return useQuery({
    queryKey: ["fechamentos_caixa", caixaId],
    queryFn: async () => {
      let query = supabase
        .from("fechamentos_caixa")
        .select("*")
        .order("created_at", { ascending: false });

      if (caixaId) {
        query = query.eq("caixa_id", caixaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FechamentoCaixa[];
    },
    enabled: !!caixaId || caixaId === undefined,
  });
}

// Mutations
export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (movimentacao: {
      tipo: "Entrada" | "Saída";
      valor: number;
      categoria_id: string | null;
      categoria_nome: string | null;
      centro_custo_id: string | null;
      forma_pagamento: string;
      descricao: string | null;
      data_hora: string;
      caixa_id: string | null;
      orcamento_id: string | null;
      realizado_por: string | null;
      usuario_email: string | null;
      autorizado_por: string | null;
      autorizado_por_email: string | null;
    }) => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .insert({ ...movimentacao, organization_id: profile?.organization_id })
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
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async ({ saldo_inicial, usuario_abertura }: { saldo_inicial: number; usuario_abertura: string }) => {
      const { data, error } = await supabase
        .from("caixas")
        .insert({
          saldo_inicial,
          usuario_abertura,
          status: "Aberto",
          organization_id: profile?.organization_id,
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

export function useFecharCaixaCego() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async ({
      caixaId,
      valoresContados,
      valoresSistema,
      usuario_fechamento,
      usuario_id,
      observacoes,
    }: {
      caixaId: string;
      valoresContados: {
        dinheiro: number;
        pix: number;
        cartao: number;
        outros: number;
      };
      valoresSistema: {
        dinheiro: number;
        pix: number;
        cartao: number;
        outros: number;
      };
      usuario_fechamento: string;
      usuario_id: string;
      observacoes?: string;
    }) => {
      const totalContado = valoresContados.dinheiro + valoresContados.pix + valoresContados.cartao + valoresContados.outros;
      const totalSistema = valoresSistema.dinheiro + valoresSistema.pix + valoresSistema.cartao + valoresSistema.outros;

      // Criar registro de fechamento detalhado
      const { error: fechamentoError } = await supabase
        .from("fechamentos_caixa")
        .insert({
          caixa_id: caixaId,
          valor_dinheiro_contado: valoresContados.dinheiro,
          valor_pix_contado: valoresContados.pix,
          valor_cartao_contado: valoresContados.cartao,
          valor_outros_contado: valoresContados.outros,
          total_contado: totalContado,
          valor_dinheiro_sistema: valoresSistema.dinheiro,
          valor_pix_sistema: valoresSistema.pix,
          valor_cartao_sistema: valoresSistema.cartao,
          valor_outros_sistema: valoresSistema.outros,
          total_sistema: totalSistema,
          diferenca_dinheiro: valoresContados.dinheiro - valoresSistema.dinheiro,
          diferenca_pix: valoresContados.pix - valoresSistema.pix,
          diferenca_cartao: valoresContados.cartao - valoresSistema.cartao,
          diferenca_outros: valoresContados.outros - valoresSistema.outros,
          diferenca_total: totalContado - totalSistema,
          realizado_por: usuario_id,
          realizado_por_email: usuario_fechamento,
          observacoes,
          organization_id: profile?.organization_id,
        });

      if (fechamentoError) throw fechamentoError;

      // Atualizar caixa como fechado
      const { data, error } = await supabase
        .from("caixas")
        .update({
          saldo_final: totalContado,
          saldo_sistema: totalSistema,
          diferenca: totalContado - totalSistema,
          usuario_fechamento,
          observacoes,
          status: "Fechado",
          data_fechamento: new Date().toISOString(),
        })
        .eq("id", caixaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa_aberto"] });
      queryClient.invalidateQueries({ queryKey: ["historico_caixas"] });
      queryClient.invalidateQueries({ queryKey: ["fechamentos_caixa"] });
      toast.success("Caixa fechado com sucesso! Confira o relatório de diferenças.");
    },
    onError: (error) => {
      toast.error("Erro ao fechar caixa", { description: error.message });
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

// Hook para calcular totais por forma de pagamento (para fechamento cego)
export function useTotaisPorFormaPagamento(movimentacoes: MovimentacaoCaixa[] | undefined) {
  if (!movimentacoes) {
    return {
      dinheiro: 0,
      pix: 0,
      cartao: 0,
      outros: 0,
      total: 0,
    };
  }

  const entradasPorForma = movimentacoes
    .filter((m) => m.tipo === "Entrada")
    .reduce(
      (acc, m) => {
        const valor = Number(m.valor);
        const forma = m.forma_pagamento.toLowerCase();
        
        if (forma === "dinheiro") {
          acc.dinheiro += valor;
        } else if (forma === "pix") {
          acc.pix += valor;
        } else if (forma.includes("cartão") || forma.includes("cartao") || forma === "débito" || forma === "crédito") {
          acc.cartao += valor;
        } else {
          acc.outros += valor;
        }
        acc.total += valor;
        return acc;
      },
      { dinheiro: 0, pix: 0, cartao: 0, outros: 0, total: 0 }
    );

  const saidasPorForma = movimentacoes
    .filter((m) => m.tipo === "Saída")
    .reduce(
      (acc, m) => {
        const valor = Number(m.valor);
        const forma = m.forma_pagamento.toLowerCase();
        
        if (forma === "dinheiro") {
          acc.dinheiro += valor;
        } else if (forma === "pix") {
          acc.pix += valor;
        } else if (forma.includes("cartão") || forma.includes("cartao") || forma === "débito" || forma === "crédito") {
          acc.cartao += valor;
        } else {
          acc.outros += valor;
        }
        acc.total += valor;
        return acc;
      },
      { dinheiro: 0, pix: 0, cartao: 0, outros: 0, total: 0 }
    );

  return {
    dinheiro: entradasPorForma.dinheiro - saidasPorForma.dinheiro,
    pix: entradasPorForma.pix - saidasPorForma.pix,
    cartao: entradasPorForma.cartao - saidasPorForma.cartao,
    outros: entradasPorForma.outros - saidasPorForma.outros,
    total: entradasPorForma.total - saidasPorForma.total,
  };
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
