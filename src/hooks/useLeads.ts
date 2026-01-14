import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type LeadInsert = TablesInsert<"leads">;
export type LeadUpdate = TablesUpdate<"leads">;

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useLeadsStats() {
  return useQuery({
    queryKey: ["leads-stats"],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      // Total leads this month
      const { count: totalMonth, error: monthError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("mes_referencia", currentMonth);

      if (monthError) throw monthError;

      // Returns for today
      const { count: todayReturns, error: todayError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("data_retorno", todayStart)
        .lt("data_retorno", todayEnd);

      if (todayError) throw todayError;

      // Open leads (not closed)
      const { count: openLeads, error: openError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("Fechado","Convertido","Perdido")');

      if (openError) throw openError;

      return {
        totalMonth: totalMonth || 0,
        todayReturns: todayReturns || 0,
        openLeads: openLeads || 0,
      };
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lead }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(lead)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
    },
  });
}
