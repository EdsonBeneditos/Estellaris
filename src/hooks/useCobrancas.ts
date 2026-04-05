import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentProfile } from "./useOrganization";

export interface Cobranca {
  id: string;
  organization_id: string;
  cliente_id: string;
  contrato_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "Pendente" | "Pago" | "Atrasado" | "Cancelado";
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  cliente_nome?: string;
}

export interface CobrancaComCliente extends Cobranca {
  cliente_nome: string;
}

/** Fetch all cobranças for the org, joined with cliente nome */
export function useCobrancas() {
  return useQuery({
    queryKey: ["cobrancas"],
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db
        .from("cobrancas")
        .select("*, clientes(nome)")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        cliente_nome: c.clientes?.nome ?? "—",
      })) as CobrancaComCliente[];
    },
    refetchInterval: 60000,
  });
}

/** Fetch cobranças for a specific client */
export function useCobrancasByCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["cobrancas", "cliente", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const db = supabase as any;
      const { data, error } = await db
        .from("cobrancas")
        .select("*, clientes(nome)")
        .eq("cliente_id", clienteId)
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        cliente_nome: c.clientes?.nome ?? "—",
      })) as CobrancaComCliente[];
    },
    enabled: !!clienteId,
  });
}

/** Count overdue / pending+past-due cobranças for sidebar badge */
export function useCobrancasAtrasadasCount() {
  return useQuery({
    queryKey: ["cobrancas_atrasadas_count"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const db = supabase as any;
      // status = Atrasado OR (status = Pendente AND data_vencimento < hoje)
      const [r1, r2] = await Promise.all([
        db.from("cobrancas").select("id", { count: "exact", head: true }).eq("status", "Atrasado"),
        db.from("cobrancas").select("id", { count: "exact", head: true }).eq("status", "Pendente").lt("data_vencimento", hoje),
      ]);
      return (r1.count || 0) + (r2.count || 0);
    },
    refetchInterval: 60000,
  });
}

export function useCreateCobranca() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (data: Omit<Cobranca, "id" | "organization_id" | "created_at" | "updated_at" | "cliente_nome">) => {
      if (!profile?.organization_id) throw new Error("Organização não encontrada");
      const db = supabase as any;
      const { error } = await db.from("cobrancas").insert({
        ...data,
        organization_id: profile.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      queryClient.invalidateQueries({ queryKey: ["cobrancas_atrasadas_count"] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar cobrança", { description: error.message });
    },
  });
}

export function useUpdateCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cobranca> }) => {
      const db = supabase as any;
      const { error } = await db.from("cobrancas").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      queryClient.invalidateQueries({ queryKey: ["cobrancas_atrasadas_count"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar cobrança", { description: error.message });
    },
  });
}

export function useMarcarComoPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clienteId,
      dataPagamento,
      formaPagamento,
      observacoes,
    }: {
      id: string;
      clienteId: string;
      dataPagamento: string;
      formaPagamento: string;
      observacoes?: string;
    }) => {
      const db = supabase as any;
      // Mark cobrança as Pago
      const { error } = await db.from("cobrancas").update({
        status: "Pago",
        data_pagamento: dataPagamento,
        forma_pagamento: formaPagamento,
        observacoes: observacoes || null,
      }).eq("id", id);
      if (error) throw error;

      // Update cliente status_financeiro
      await sincronizarStatusFinanceiroCliente(clienteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      queryClient.invalidateQueries({ queryKey: ["cobrancas_atrasadas_count"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cobrança marcada como paga!");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar pagamento", { description: error.message });
    },
  });
}

/** Update any Pendente cobranças whose data_vencimento < today to Atrasado */
export async function atualizarCobrancasAtrasadas(): Promise<void> {
  const hoje = new Date().toISOString().split("T")[0];
  const db = supabase as any;
  await db
    .from("cobrancas")
    .update({ status: "Atrasado" })
    .eq("status", "Pendente")
    .lt("data_vencimento", hoje);
}

/** Sync cliente.status_financeiro based on their cobranças */
export async function sincronizarStatusFinanceiroCliente(clienteId: string): Promise<void> {
  const db = supabase as any;
  const { data: cobrancas } = await db
    .from("cobrancas")
    .select("status")
    .eq("cliente_id", clienteId);

  const temAtrasada = (cobrancas || []).some((c: any) => c.status === "Atrasado");
  const novoStatus = temAtrasada ? "Inadimplente" : "Em dia";

  await db.from("clientes").update({ status_financeiro: novoStatus }).eq("id", clienteId);
}

/** Generate monthly cobranças from active recurring contracts */
export function useGerarCobrancasDoMes() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error("Organização não encontrada");
      const db = supabase as any;

      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      const mesStr = String(mesAtual).padStart(2, "0");
      const inicioMes = `${anoAtual}-${mesStr}-01`;
      const fimMes = `${anoAtual}-${mesStr}-28`; // safe upper bound

      // Fetch active recurring contracts with cliente dia_vencimento
      const { data: contratos, error: errContratos } = await db
        .from("contratos_historico")
        .select("id, cliente_id, servico_prestado, valor, clientes(dia_vencimento, nome)")
        .eq("status", "Ativo")
        .eq("recorrente", true);

      if (errContratos) throw errContratos;

      // Fetch existing cobrancas for this month (to avoid duplicates)
      const { data: existentes } = await db
        .from("cobrancas")
        .select("contrato_id, data_vencimento")
        .gte("data_vencimento", inicioMes)
        .lte("data_vencimento", fimMes);

      const existentesSet = new Set(
        (existentes || []).map((e: any) => e.contrato_id)
      );

      let geradas = 0;
      const inserts: any[] = [];

      for (const contrato of contratos || []) {
        if (existentesSet.has(contrato.id)) continue;

        const diaVencimento = contrato.clientes?.dia_vencimento ?? 10;
        const dia = Math.min(diaVencimento, 28);
        const dataVencimento = `${anoAtual}-${mesStr}-${String(dia).padStart(2, "0")}`;

        inserts.push({
          organization_id: profile.organization_id,
          cliente_id: contrato.cliente_id,
          contrato_id: contrato.id,
          descricao: `Mensalidade - ${contrato.servico_prestado}`,
          valor: contrato.valor,
          data_vencimento: dataVencimento,
          status: "Pendente",
        });
        geradas++;
      }

      if (inserts.length > 0) {
        const { error } = await db.from("cobrancas").insert(inserts);
        if (error) throw error;
      }

      return geradas;
    },
    onSuccess: (geradas) => {
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      queryClient.invalidateQueries({ queryKey: ["cobrancas_atrasadas_count"] });
      if (geradas === 0) {
        toast.info("Nenhuma cobrança nova gerada (já existem para este mês).");
      } else {
        toast.success(`${geradas} cobrança(s) gerada(s) com sucesso!`);
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar cobranças", { description: error.message });
    },
  });
}
