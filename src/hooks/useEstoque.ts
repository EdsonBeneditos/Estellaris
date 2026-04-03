import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";

// Types
export interface GrupoProduto {
  id: string;
  nome: string;
  numero_referencia: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  marca: string | null;
  descricao: string | null;
  preco_venda: number;
  preco_custo: number;
  quantidade_estoque: number;
  unidade_medida: string;
  grupo_id: string | null;
  ativo: boolean;
  ncm: string | null;
  cest: string | null;
  origem_mercadoria: number | null;
  cst_csosn: string | null;
  cfop: string | null;
  organization_id: string | null;
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
  const { data: profile } = useCurrentProfile();
  
  return useMutation({
    mutationFn: async ({ nome, numero_referencia }: { nome: string; numero_referencia: string }) => {
      const { data, error } = await supabase
        .from("grupos_produtos")
        .insert({ nome, numero_referencia, organization_id: profile?.organization_id })
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
        .order("created_at", { ascending: false });

      if (grupoId) {
        query = query.eq("grupo_id", grupoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Produto[];
    },
  });
}

// Count products per group
export function useProdutosCountByGrupo() {
  return useQuery({
    queryKey: ["produtos_count_by_grupo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("grupo_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p: { grupo_id: string | null }) => {
        if (p.grupo_id) {
          counts[p.grupo_id] = (counts[p.grupo_id] || 0) + 1;
        }
      });
      return counts;
    },
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  
  return useMutation({
    mutationFn: async (produto: Omit<Produto, "id" | "created_at" | "updated_at" | "grupo" | "organization_id">) => {
      const { data, error } = await supabase
        .from("produtos")
        .insert({ ...produto, organization_id: profile?.organization_id })
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
