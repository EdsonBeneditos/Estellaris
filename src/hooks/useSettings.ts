import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface Vendedor {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export interface TipoServico {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export interface Origem {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

// Vendedores
export function useVendedores() {
  return useQuery({
    queryKey: ["vendedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendedores")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Vendedor[];
    },
  });
}

export function useActiveVendedores() {
  return useQuery({
    queryKey: ["vendedores", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendedores")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Vendedor[];
    },
  });
}

export function useCreateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("vendedores")
        .insert({ nome })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
    },
  });
}

export function useDeleteVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
    },
  });
}

export function useToggleVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("vendedores")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
    },
  });
}

// Tipos de Serviço
export function useTiposServico() {
  return useQuery({
    queryKey: ["tipos-servico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_servico")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as TipoServico[];
    },
  });
}

export function useActiveTiposServico() {
  return useQuery({
    queryKey: ["tipos-servico", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_servico")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as TipoServico[];
    },
  });
}

export function useCreateTipoServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("tipos_servico")
        .insert({ nome })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-servico"] });
    },
  });
}

export function useDeleteTipoServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tipos_servico").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-servico"] });
    },
  });
}

export function useToggleTipoServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("tipos_servico")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-servico"] });
    },
  });
}

// Origens
export function useOrigens() {
  return useQuery({
    queryKey: ["origens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("origens")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Origem[];
    },
  });
}

export function useActiveOrigens() {
  return useQuery({
    queryKey: ["origens", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("origens")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Origem[];
    },
  });
}

export function useCreateOrigem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("origens")
        .insert({ nome })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    },
  });
}

export function useDeleteOrigem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("origens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    },
  });
}

export function useToggleOrigem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("origens")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    },
  });
}
