import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentProfile } from "./useOrganization";

export interface AtividadeCliente {
  id: string;
  organization_id: string;
  cliente_id: string;
  tipo: "Nota" | "Sistema" | "Contrato";
  descricao: string;
  data_hora: string;
  realizado_por: string | null;
  realizado_por_email: string | null;
  created_at: string;
}

export function useAtividadesCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["atividades-cliente", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from("atividades_cliente")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("data_hora", { ascending: false });

      if (error) throw error;
      return data as AtividadeCliente[];
    },
    enabled: !!clienteId,
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      tipo: "Nota" | "Sistema" | "Contrato";
      descricao: string;
    }) => {
      if (!profile?.organization_id) {
        throw new Error("Organização não encontrada");
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("atividades_cliente").insert({
        organization_id: profile.organization_id,
        cliente_id: data.cliente_id,
        tipo: data.tipo,
        descricao: data.descricao,
        realizado_por: userData.user?.id,
        realizado_por_email: userData.user?.email,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["atividades-cliente", variables.cliente_id],
      });
      toast.success("Nota adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar nota", { description: error.message });
    },
  });
}

// Helper para registrar atividade de sistema (importação, etc.)
export async function registrarAtividadeSistema(
  organizationId: string,
  clienteId: string,
  descricao: string
) {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("atividades_cliente").insert({
    organization_id: organizationId,
    cliente_id: clienteId,
    tipo: "Sistema",
    descricao: descricao,
    realizado_por: userData.user?.id,
    realizado_por_email: userData.user?.email,
  });

  if (error) {
    console.error("Erro ao registrar atividade:", error);
  }
}
