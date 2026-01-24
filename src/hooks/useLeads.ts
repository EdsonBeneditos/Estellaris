import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useCurrentProfile } from "@/hooks/useOrganization";

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

      // Overdue leads (return date before today and not finalized)
      const { count: overdueLeads, error: overdueError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .lt("data_retorno", todayStart)
        .not("status", "in", '("Fechado","Convertido","Perdido")');

      if (overdueError) throw overdueError;

      return {
        totalMonth: totalMonth || 0,
        todayReturns: todayReturns || 0,
        openLeads: openLeads || 0,
        overdueLeads: overdueLeads || 0,
      };
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...lead, organization_id: profile?.organization_id })
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
    mutationFn: async ({ id, data }: { id: string; data: LeadUpdate }) => {
      const { data: result, error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leads-per-day"] });
      queryClient.invalidateQueries({ queryKey: ["vendedor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["origem-stats"] });
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
