import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useFuturosLeadsHojeCount() {
  return useQuery({
    queryKey: ["futuros_leads_hoje_count"],
    queryFn: async () => {
      const hoje = format(new Date(), "yyyy-MM-dd");
      const { count, error } = await supabase
        .from("futuros_leads")
        .select("*", { count: "exact", head: true })
        .eq("data_prevista_contato", hoje);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60000,
  });
}
