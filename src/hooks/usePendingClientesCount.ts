import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PENDENTE_CADASTRO_MARKER = "__PENDENTE_CADASTRO__";

export function usePendingClientesCount() {
  return useQuery({
    queryKey: ["pending_clientes_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .like("observacoes", `${PENDENTE_CADASTRO_MARKER}%`);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}
