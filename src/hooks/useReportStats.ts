import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendedorStats {
  vendedor: string;
  count: number;
}

export interface LeadsPerDay {
  date: string;
  count: number;
}

export interface OrigemStats {
  origem: string;
  count: number;
}

export function useVendedorStats() {
  return useQuery({
    queryKey: ["vendedor-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("vendedor");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((lead) => {
        const vendedor = lead.vendedor || "Não atribuído";
        counts[vendedor] = (counts[vendedor] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([vendedor, count]) => ({ vendedor, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

export function useLeadsPerDay() {
  return useQuery({
    queryKey: ["leads-per-day"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((lead) => {
        const date = lead.created_at.split("T")[0];
        counts[date] = (counts[date] || 0) + 1;
      });

      // Fill in missing days with 0
      const result: LeadsPerDay[] = [];
      const currentDate = new Date(thirtyDaysAgo);
      const today = new Date();

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        result.push({
          date: dateStr,
          count: counts[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    },
  });
}

export function useOrigemStats() {
  return useQuery({
    queryKey: ["origem-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("origem");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((lead) => {
        const origem = lead.origem || "Não informado";
        counts[origem] = (counts[origem] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([origem, count]) => ({ origem, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}
