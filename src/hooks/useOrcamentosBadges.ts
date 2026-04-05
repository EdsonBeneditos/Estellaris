import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Orçamentos com status = 'Pendente' (badge no menu Orçamentos) */
export function useOrcamentosPendentesCount() {
  return useQuery({
    queryKey: ["orcamentos_pendentes_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orcamentos")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pendente");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}

/** Orçamentos com status_financeiro = 'aguardando_pagamento' (badge no menu Financeiro) */
export function useAguardandoPagamentoCount() {
  return useQuery({
    queryKey: ["aguardando_pagamento_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orcamentos")
        .select("id", { count: "exact", head: true })
        .eq("status_financeiro", "aguardando_pagamento");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}
