import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";

export interface LeadInteracao {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  created_at: string;
}

export function useLeadInteracoes(leadId: string) {
  return useQuery({
    queryKey: ["lead-interacoes", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_interacoes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadInteracao[];
    },
    enabled: !!leadId,
  });
}

export function useCreateInteracao() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  
  return useMutation({
    mutationFn: async (interacao: {
      lead_id: string;
      tipo: string;
      descricao?: string;
      status_anterior?: string;
      status_novo?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_interacoes")
        .insert({ ...interacao, organization_id: profile?.organization_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lead-interacoes", variables.lead_id],
      });
    },
  });
}
