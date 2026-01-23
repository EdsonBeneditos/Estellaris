import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Produto,
  useCreateProduto,
  useUpdateProduto,
  useGruposProdutos,
} from "@/hooks/useEstoque";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  preco_venda: z.coerce.number().min(0, "Preço de venda inválido"),
  preco_custo: z.coerce.number().min(0, "Preço de custo inválido"),
  quantidade_estoque: z.coerce.number().int().min(0, "Quantidade inválida"),
  unidade_medida: z.string().min(1, "Unidade é obrigatória"),
  grupo_id: z.string().nullable(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const UNIDADES = [
  { value: "UN", label: "Unidade (UN)" },
  { value: "CX", label: "Caixa (CX)" },
  { value: "KG", label: "Quilograma (KG)" },
  { value: "L", label: "Litro (L)" },
  { value: "M", label: "Metro (M)" },
  { value: "M2", label: "Metro² (M²)" },
  { value: "M3", label: "Metro³ (M³)" },
  { value: "PC", label: "Peça (PC)" },
  { value: "PAR", label: "Par (PAR)" },
  { value: "PCT", label: "Pacote (PCT)" },
];

interface ProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
}

export function ProdutoModal({ open, onOpenChange, produto }: ProdutoModalProps) {
  const { data: grupos = [] } = useGruposProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      sku: "",
      preco_venda: 0,
      preco_custo: 0,
      quantidade_estoque: 0,
      unidade_medida: "UN",
      grupo_id: null,
      ativo: true,
    },
  });

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        sku: produto.sku,
        preco_venda: produto.preco_venda,
        preco_custo: produto.preco_custo,
        quantidade_estoque: produto.quantidade_estoque,
        unidade_medida: produto.unidade_medida,
        grupo_id: produto.grupo_id,
        ativo: produto.ativo,
      });
    } else {
      form.reset({
        nome: "",
        sku: "",
        preco_venda: 0,
        preco_custo: 0,
        quantidade_estoque: 0,
        unidade_medida: "UN",
        grupo_id: null,
        ativo: true,
      });
    }
  }, [produto, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      if (produto) {
        await updateProduto.mutateAsync({ id: produto.id, ...data });
        toast.success("Produto atualizado com sucesso");
      } else {
        await createProduto.mutateAsync({
          nome: data.nome,
          sku: data.sku,
          preco_venda: data.preco_venda,
          preco_custo: data.preco_custo,
          quantidade_estoque: data.quantidade_estoque,
          unidade_medida: data.unidade_medida,
          grupo_id: data.grupo_id,
          ativo: data.ativo,
        });
        toast.success("Produto criado com sucesso");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar produto");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{produto ? "Editar Produto" : "Novo Produto"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Filtro de Água Premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU / Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: FLT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidade_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES.map((un) => (
                          <SelectItem key={un.value} value={un.value}>
                            {un.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preco_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantidade_estoque"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Estoque</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grupo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo / Departamento</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem grupo</SelectItem>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nome} ({grupo.numero_referencia})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProduto.isPending || updateProduto.isPending}
              >
                {produto ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
