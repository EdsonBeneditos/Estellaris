import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MovimentacaoCaixa } from "./useFinanceiro";
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Hook para buscar todas as movimentações (para relatórios)
export function useAllMovimentacoes() {
  return useQuery({
    queryKey: ["all_movimentacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .order("data_hora", { ascending: true });

      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
  });
}

// Dados para gráfico comparativo Entradas vs Saídas dos últimos 6 meses
export function useEntradasVsSaidasMensal(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) return [];

    const now = new Date();
    const months: { mes: string; mesKey: string; entradas: number; saidas: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const mesKey = format(date, "yyyy-MM");
      const mesLabel = format(date, "MMM/yy", { locale: ptBR });

      const movimentacoesMes = movimentacoes.filter((m) => {
        const mDate = parseISO(m.data_hora);
        return format(mDate, "yyyy-MM") === mesKey;
      });

      const entradas = movimentacoesMes
        .filter((m) => m.tipo === "Entrada")
        .reduce((acc, m) => acc + Number(m.valor), 0);

      const saidas = movimentacoesMes
        .filter((m) => m.tipo === "Saída")
        .reduce((acc, m) => acc + Number(m.valor), 0);

      months.push({
        mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
        mesKey,
        entradas,
        saidas,
      });
    }

    return months;
  }, [movimentacoes]);
}

// Evolução do saldo acumulado dia a dia (último mês)
export function useSaldoAcumuladoDiario(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) return [];

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    // Calcular saldo inicial (antes do início do mês atual)
    const movimentacoesAnteriores = movimentacoes.filter((m) => {
      return parseISO(m.data_hora) < start;
    });

    let saldoAcumulado = movimentacoesAnteriores.reduce((acc, m) => {
      if (m.tipo === "Entrada") return acc + Number(m.valor);
      return acc - Number(m.valor);
    }, 0);

    const result = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      
      const movimentacoesDia = movimentacoes.filter((m) => {
        return format(parseISO(m.data_hora), "yyyy-MM-dd") === dayStr;
      });

      movimentacoesDia.forEach((m) => {
        if (m.tipo === "Entrada") {
          saldoAcumulado += Number(m.valor);
        } else {
          saldoAcumulado -= Number(m.valor);
        }
      });

      return {
        dia: format(day, "dd"),
        diaCompleto: format(day, "dd/MM", { locale: ptBR }),
        saldo: saldoAcumulado,
      };
    });

    return result;
  }, [movimentacoes]);
}

// Mix de pagamentos - Entradas por forma de pagamento
export function useMixPagamentosEntradas(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) return [];

    const entradasPorForma: Record<string, number> = {};

    movimentacoes
      .filter((m) => m.tipo === "Entrada")
      .forEach((m) => {
        const forma = m.forma_pagamento || "Outros";
        entradasPorForma[forma] = (entradasPorForma[forma] || 0) + Number(m.valor);
      });

    const cores: Record<string, string> = {
      Dinheiro: "#10B981",
      Pix: "#8B5CF6",
      "Cartão Crédito": "#3B82F6",
      "Cartão Débito": "#06B6D4",
      Boleto: "#F59E0B",
      Transferência: "#EC4899",
      Outros: "#6B7280",
    };

    return Object.entries(entradasPorForma)
      .map(([forma, valor]) => ({
        forma,
        valor,
        color: cores[forma] || "#6B7280",
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [movimentacoes]);
}

// Mix de pagamentos - Saídas por forma de pagamento
export function useMixPagamentosSaidas(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) return [];

    const saidasPorForma: Record<string, number> = {};

    movimentacoes
      .filter((m) => m.tipo === "Saída")
      .forEach((m) => {
        const forma = m.forma_pagamento || "Outros";
        saidasPorForma[forma] = (saidasPorForma[forma] || 0) + Number(m.valor);
      });

    const cores: Record<string, string> = {
      Dinheiro: "#EF4444",
      Pix: "#F97316",
      "Cartão Crédito": "#DC2626",
      "Cartão Débito": "#FB7185",
      Boleto: "#FBBF24",
      Transferência: "#A855F7",
      Outros: "#6B7280",
    };

    return Object.entries(saidasPorForma)
      .map(([forma, valor]) => ({
        forma,
        valor,
        color: cores[forma] || "#6B7280",
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [movimentacoes]);
}

// Gastos por Centro de Custo
export function useGastosPorCentroCusto(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) return [];

    const gastosPorCentro: Record<string, { nome: string; valor: number }> = {};

    // Apenas saídas com centro de custo definido
    movimentacoes
      .filter((m) => m.tipo === "Saída" && m.centro_custo_id)
      .forEach((m) => {
        const centroId = m.centro_custo_id!;
        if (!gastosPorCentro[centroId]) {
          gastosPorCentro[centroId] = {
            nome: "Centro " + centroId.slice(0, 8), // Placeholder, será substituído
            valor: 0,
          };
        }
        gastosPorCentro[centroId].valor += Number(m.valor);
      });

    const cores = [
      "#EF4444", "#F97316", "#F59E0B", "#84CC16",
      "#10B981", "#14B8A6", "#06B6D4", "#3B82F6",
      "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
    ];

    return Object.entries(gastosPorCentro)
      .map(([id, data], index) => ({
        id,
        nome: data.nome,
        valor: data.valor,
        color: cores[index % cores.length],
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [movimentacoes]);
}

// Projeção para o próximo mês (média líquida dos últimos 3 meses + saldo atual)
export function useProjecaoProximoMes(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) {
      return {
        mediaLiquida: 0,
        saldoAtual: 0,
        projecao: 0,
        tendencia: "estavel" as const,
      };
    }

    const now = new Date();
    const ultimos3Meses: number[] = [];

    // Calcular saldo líquido de cada um dos últimos 3 meses
    for (let i = 1; i <= 3; i++) {
      const date = subMonths(now, i);
      const mesKey = format(date, "yyyy-MM");

      const movimentacoesMes = movimentacoes.filter((m) => {
        const mDate = parseISO(m.data_hora);
        return format(mDate, "yyyy-MM") === mesKey;
      });

      const entradas = movimentacoesMes
        .filter((m) => m.tipo === "Entrada")
        .reduce((acc, m) => acc + Number(m.valor), 0);

      const saidas = movimentacoesMes
        .filter((m) => m.tipo === "Saída")
        .reduce((acc, m) => acc + Number(m.valor), 0);

      ultimos3Meses.push(entradas - saidas);
    }

    const mediaLiquida =
      ultimos3Meses.length > 0
        ? ultimos3Meses.reduce((a, b) => a + b, 0) / ultimos3Meses.length
        : 0;

    // Saldo atual (todas as movimentações até agora)
    const saldoAtual = movimentacoes.reduce((acc, m) => {
      if (m.tipo === "Entrada") return acc + Number(m.valor);
      return acc - Number(m.valor);
    }, 0);

    const projecao = saldoAtual + mediaLiquida;

    let tendencia: "positiva" | "negativa" | "estavel" = "estavel";
    if (mediaLiquida > 0) tendencia = "positiva";
    if (mediaLiquida < 0) tendencia = "negativa";

    return {
      mediaLiquida,
      saldoAtual,
      projecao,
      tendencia,
    };
  }, [movimentacoes]);
}

// Totais gerais do período atual
export function useTotaisGerais(movimentacoes: MovimentacaoCaixa[] | undefined) {
  return useMemo(() => {
    if (!movimentacoes) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0,
      };
    }

    const now = new Date();
    const mesAtual = format(now, "yyyy-MM");

    const movimentacoesMes = movimentacoes.filter((m) => {
      const mDate = parseISO(m.data_hora);
      return format(mDate, "yyyy-MM") === mesAtual;
    });

    const totalEntradas = movimentacoesMes
      .filter((m) => m.tipo === "Entrada")
      .reduce((acc, m) => acc + Number(m.valor), 0);

    const totalSaidas = movimentacoesMes
      .filter((m) => m.tipo === "Saída")
      .reduce((acc, m) => acc + Number(m.valor), 0);

    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
    };
  }, [movimentacoes]);
}
