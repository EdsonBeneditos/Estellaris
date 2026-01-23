import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface GrupoProduto {
  id: string;
  nome: string;
  numero_referencia: string;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  preco_venda: number;
  preco_custo: number;
  quantidade_estoque: number;
  unidade_medida: string;
  grupo_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  grupo?: GrupoProduto;
}

// Grupos hooks
export function useGruposProdutos() {
  return useQuery({
    queryKey: ["grupos_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos_produtos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as GrupoProduto[];
    },
  });
}

export function useCreateGrupoProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, numero_referencia }: { nome: string; numero_referencia: string }) => {
      const { data, error } = await supabase
        .from("grupos_produtos")
        .insert({ nome, numero_referencia })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos_produtos"] });
    },
  });
}

export function useUpdateGrupoProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome, numero_referencia }: { id: string; nome: string; numero_referencia: string }) => {
      const { data, error } = await supabase
        .from("grupos_produtos")
        .update({ nome, numero_referencia })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos_produtos"] });
    },
  });
}

export function useDeleteGrupoProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grupos_produtos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos_produtos"] });
    },
  });
}

// Produtos hooks
export function useProdutos(grupoId?: string | null) {
  return useQuery({
    queryKey: ["produtos", grupoId],
    queryFn: async () => {
      let query = supabase
        .from("produtos")
        .select(`
          *,
          grupo:grupos_produtos(*)
        `)
        .order("nome");

      if (grupoId) {
        query = query.eq("grupo_id", grupoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Produto[];
    },
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produto: Omit<Produto, "id" | "created_at" | "updated_at" | "grupo">) => {
      const { data, error } = await supabase
        .from("produtos")
        .insert(produto)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...produto }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase
        .from("produtos")
        .update(produto)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}
