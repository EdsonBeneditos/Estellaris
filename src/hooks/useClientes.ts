import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentProfile } from "./useOrganization";
import { registrarAtividadeSistema } from "./useAtividadesCliente";

export interface Cliente {
  id: string;
  organization_id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  rotina_visitas: boolean;
  frequencia_visita: string | null;
  ultima_visita: string | null;
  proxima_visita: string | null;
  observacoes: string | null;
  ativo: boolean;
  contrato_pdf_url: string | null;
  // Contato
  nome_contato: string | null;
  whatsapp: string | null;
  site: string | null;
  // Comercial
  segmento: string | null;
  porte_empresa: string | null;
  responsavel_comercial: string | null;
  origem_lead: string | null;
  // Financeiro
  limite_credito: number | null;
  forma_pagamento: string | null;
  status_financeiro: string | null;
  dia_vencimento: number | null;
  // Endereço completo
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  // CRM
  tags: string[] | null;
  score_satisfacao: number | null;
  observacoes_internas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: string;
  organization_id: string;
  cliente_id: string;
  tipo_vinculo: string;
  servico_prestado: string;
  valor: number;
  recorrente: boolean;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  contrato_anterior_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClienteComContratos extends Cliente {
  contratos: Contrato[];
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useClientesComContratos() {
  return useQuery({
    queryKey: ["clientes-com-contratos"],
    queryFn: async () => {
      // Buscar clientes
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");

      if (clientesError) throw clientesError;

      // Buscar contratos
      const { data: contratos, error: contratosError } = await supabase
        .from("contratos_historico")
        .select("*")
        .order("data_inicio", { ascending: false });

      if (contratosError) throw contratosError;

      // Combinar dados
      const clientesComContratos: ClienteComContratos[] = (clientes || []).map(
        (cliente) => ({
          ...cliente,
          contratos: (contratos || []).filter((c) => c.cliente_id === cliente.id),
        })
      );

      return clientesComContratos;
    },
  });
}

export function useContratosByCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["contratos", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from("contratos_historico")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data as Contrato[];
    },
    enabled: !!clienteId,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: Partial<Cliente>) => {
      if (!profile?.organization_id) {
        throw new Error("Organização não encontrada");
      }

      const insertData = {
        ...data,
        organization_id: profile.organization_id,
      } as any;

      const { data: created, error } = await supabase
        .from("clientes")
        .insert(insertData)
        .select("id")
        .single();

      if (error) throw error;
      return { id: created?.id as string, organizationId: profile.organization_id };
    },
    onSuccess: async (result) => {
      if (result?.id) {
        const { data: userData } = await supabase.auth.getUser();
        const email = userData.user?.email;
        await registrarAtividadeSistema(
          result.organizationId,
          result.id,
          email ? `Cliente cadastrado por ${email}` : "Cliente cadastrado"
        );
      }
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente", { description: error.message });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cliente> }) => {
      const { error } = await supabase
        .from("clientes")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente", { description: error.message });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover cliente", { description: error.message });
    },
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: Partial<Contrato>) => {
      if (!profile?.organization_id) {
        throw new Error("Organização não encontrada");
      }

      const insertData = {
        ...data,
        organization_id: profile.organization_id,
      } as any;

      const { error } = await supabase.from("contratos_historico").insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Contrato cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar contrato", { description: error.message });
    },
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Contrato>;
    }) => {
      const { error } = await supabase
        .from("contratos_historico")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Contrato atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contrato", { description: error.message });
    },
  });
}

export function useRenovarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      novaDataInicio,
      novaDataFim,
      novoValor,
    }: {
      contratoId: string;
      novaDataInicio: string;
      novaDataFim: string;
      novoValor?: number;
    }) => {
      const { data, error } = await supabase.rpc("renovar_contrato", {
        p_contrato_id: contratoId,
        p_nova_data_inicio: novaDataInicio,
        p_nova_data_fim: novaDataFim,
        p_novo_valor: novoValor ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Contrato renovado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao renovar contrato", { description: error.message });
    },
  });
}

export function useUploadContratoPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, file }: { clienteId: string; file: File }) => {
      const ext = file.name.split(".").pop();
      const path = `${clienteId}/contrato.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("contratos-clientes")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("contratos-clientes")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("clientes")
        .update({ contrato_pdf_url: publicUrl } as any)
        .eq("id", clienteId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Contrato anexado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao anexar contrato", { description: error.message });
    },
  });
}

export function useRemoveContratoPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ contrato_pdf_url: null } as any)
        .eq("id", clienteId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
      toast.success("Contrato removido.");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover contrato", { description: error.message });
    },
  });
}

// Helper para calcular dias até vencimento
export function diasAteVencimento(dataFim: string | null): number | null {
  if (!dataFim) return null;
  const hoje = new Date();
  const fim = new Date(dataFim);
  const diffTime = fim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper para calcular tempo total de fidelidade (em meses)
export function calcularFidelidade(contratos: Contrato[]): number {
  let totalMeses = 0;

  contratos.forEach((contrato) => {
    const inicio = new Date(contrato.data_inicio);
    const fim = contrato.data_fim ? new Date(contrato.data_fim) : new Date();
    const diffTime = fim.getTime() - inicio.getTime();
    const meses = diffTime / (1000 * 60 * 60 * 24 * 30);
    totalMeses += meses;
  });

  return Math.round(totalMeses);
}
