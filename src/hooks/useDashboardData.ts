import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// Financial Summary Hook
export function useResumoFinanceiro(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-resumo-financeiro"],
    queryFn: async () => {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);

      // Get current month movements
      const { data: movimentacoes, error } = await supabase
        .from("movimentacoes_caixa")
        .select("tipo, valor")
        .gte("data_hora", startOfCurrentMonth.toISOString())
        .lte("data_hora", endOfCurrentMonth.toISOString());

      if (error) throw error;

      const entradas = movimentacoes
        ?.filter((m) => m.tipo === "Entrada")
        .reduce((acc, m) => acc + Number(m.valor), 0) || 0;

      const saidas = movimentacoes
        ?.filter((m) => m.tipo === "Saída")
        .reduce((acc, m) => acc + Number(m.valor), 0) || 0;

      return {
        entradas,
        saidas,
        saldo: entradas - saidas,
        totalMovimentacoes: movimentacoes?.length || 0,
      };
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Upcoming Visits Hook
export function useProximasVisitas(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-proximas-visitas"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, proxima_visita")
        .eq("rotina_visitas", true)
        .eq("ativo", true)
        .not("proxima_visita", "is", null)
        .lte("proxima_visita", nextWeek.toISOString().split("T")[0])
        .order("proxima_visita", { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data || []).map((cliente) => {
        const visitDate = new Date(cliente.proxima_visita + "T00:00:00");
        const diffDays = Math.floor((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: "atrasada" | "hoje" | "proxima" = "proxima";
        if (diffDays < 0) status = "atrasada";
        else if (diffDays === 0) status = "hoje";

        return {
          ...cliente,
          diasAte: diffDays,
          status,
        };
      });
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Expiring Contracts Hook (60 days)
export function useContratosVencer(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-contratos-vencer"],
    queryFn: async () => {
      const today = new Date();
      const in60Days = new Date(today);
      in60Days.setDate(in60Days.getDate() + 60);

      const { data, error } = await supabase
        .from("contratos_historico")
        .select(`
          id,
          data_fim,
          valor,
          servico_prestado,
          cliente_id,
          clientes (
            id,
            nome
          )
        `)
        .eq("status", "Ativo")
        .not("data_fim", "is", null)
        .gte("data_fim", today.toISOString().split("T")[0])
        .lte("data_fim", in60Days.toISOString().split("T")[0])
        .order("data_fim", { ascending: true })
        .limit(10);

      if (error) throw error;

      return (data || []).map((contrato) => {
        const endDate = new Date(contrato.data_fim + "T00:00:00");
        const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...contrato,
          diasRestantes: diffDays,
          clienteNome: (contrato.clientes as any)?.nome || "Cliente não encontrado",
        };
      });
    },
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Leads Evolution Hook
export function useEvolucaoLeads(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-evolucao-leads"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          key: format(date, "yyyy-MM"),
          label: format(date, "MMM", { locale: undefined }),
        });
      }

      const { data, error } = await supabase
        .from("leads")
        .select("created_at, status")
        .gte("created_at", subMonths(new Date(), 6).toISOString());

      if (error) throw error;

      const monthlyData = months.map((month) => {
        const monthLeads = data?.filter((lead) =>
          lead.created_at.startsWith(month.key)
        ) || [];

        return {
          month: month.label,
          total: monthLeads.length,
          convertidos: monthLeads.filter((l) => l.status === "Fechado").length,
          perdidos: monthLeads.filter((l) => l.status === "Perdido").length,
        };
      });

      const totalLeads = data?.length || 0;
      const fechados = data?.filter((l) => l.status === "Fechado").length || 0;
      const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : "0";

      return {
        chartData: monthlyData,
        totalLeads,
        taxaConversao,
      };
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
