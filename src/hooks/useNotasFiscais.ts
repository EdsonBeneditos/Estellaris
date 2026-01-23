import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NotaFiscal = {
  id: string;
  numero_nota: number;
  orcamento_id: string | null;
  
  // Emitente
  emitente_razao_social: string | null;
  emitente_cnpj: string | null;
  emitente_endereco: string | null;
  emitente_cidade: string | null;
  emitente_uf: string | null;
  emitente_cep: string | null;
  emitente_telefone: string | null;
  emitente_ie: string | null;
  
  // Destinatário
  destinatario_nome: string;
  destinatario_cnpj: string | null;
  destinatario_endereco: string | null;
  destinatario_cidade: string | null;
  destinatario_uf: string | null;
  destinatario_cep: string | null;
  destinatario_telefone: string | null;
  destinatario_email: string | null;
  destinatario_ie: string | null;
  
  // Dados da Nota
  chave_acesso: string | null;
  natureza_operacao: string | null;
  data_emissao: string;
  data_saida: string | null;
  
  // Valores
  valor_produtos: number;
  valor_frete: number | null;
  valor_seguro: number | null;
  valor_desconto: number | null;
  valor_outras_despesas: number | null;
  valor_total: number;
  
  // Tributos
  base_calculo_icms: number | null;
  valor_icms: number | null;
  base_calculo_icms_st: number | null;
  valor_icms_st: number | null;
  valor_ipi: number | null;
  valor_pis: number | null;
  valor_cofins: number | null;
  valor_total_tributos: number | null;
  
  // Informações
  informacoes_adicionais: string | null;
  observacoes_fisco: string | null;
  
  // Status
  status: string;
  
  created_at: string;
  updated_at: string;
};

export type NotaFiscalItem = {
  id: string;
  nota_fiscal_id: string;
  produto_id: string;
  codigo: string;
  descricao: string;
  ncm: string | null;
  cfop: string | null;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  base_icms: number | null;
  aliquota_icms: number | null;
  valor_icms: number | null;
  aliquota_ipi: number | null;
  valor_ipi: number | null;
  created_at: string;
};

export type NotaFiscalInsert = Omit<NotaFiscal, 'id' | 'numero_nota' | 'created_at' | 'updated_at'>;
export type NotaFiscalItemInsert = Omit<NotaFiscalItem, 'id' | 'created_at'>;

export const useNotasFiscais = () => {
  return useQuery({
    queryKey: ["notas_fiscais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NotaFiscal[];
    },
  });
};

export const useNotaFiscal = (id: string | null) => {
  return useQuery({
    queryKey: ["nota_fiscal", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as NotaFiscal;
    },
    enabled: !!id,
  });
};

export const useNotaFiscalItens = (notaFiscalId: string | null) => {
  return useQuery({
    queryKey: ["nota_fiscal_itens", notaFiscalId],
    queryFn: async () => {
      if (!notaFiscalId) return [];
      
      const { data, error } = await supabase
        .from("nota_fiscal_itens")
        .select("*")
        .eq("nota_fiscal_id", notaFiscalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as NotaFiscalItem[];
    },
    enabled: !!notaFiscalId,
  });
};

export const useCreateNotaFiscal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NotaFiscalInsert) => {
      const { data: nota, error } = await supabase
        .from("notas_fiscais")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return nota;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar nota fiscal: " + error.message);
    },
  });
};

export const useUpdateNotaFiscal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NotaFiscal> }) => {
      const { data: nota, error } = await supabase
        .from("notas_fiscais")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return nota;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      queryClient.invalidateQueries({ queryKey: ["nota_fiscal"] });
      toast.success("Nota fiscal atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar nota fiscal: " + error.message);
    },
  });
};

export const useDeleteNotaFiscal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notas_fiscais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir nota fiscal: " + error.message);
    },
  });
};

export const useBulkCreateNotaFiscalItens = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notaFiscalId, items }: { notaFiscalId: string; items: Omit<NotaFiscalItemInsert, 'nota_fiscal_id'>[] }) => {
      const itemsWithNotaId = items.map(item => ({
        ...item,
        nota_fiscal_id: notaFiscalId,
      }));

      const { data, error } = await supabase
        .from("nota_fiscal_itens")
        .insert(itemsWithNotaId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nota_fiscal_itens", variables.notaFiscalId] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar itens: " + error.message);
    },
  });
};
