import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePendingBudgetsCount() {
  return useQuery({
    queryKey: ["pending_budgets_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "Aprovado")
        .eq("status_financeiro", "pendente");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
