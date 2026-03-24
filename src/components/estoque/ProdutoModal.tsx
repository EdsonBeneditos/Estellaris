import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Produto,
  useCreateProduto,
  useUpdateProduto,
  useGruposProdutos,
  useProdutos,
} from "@/hooks/useEstoque";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  marca: z.string().optional().or(z.literal("")),
  descricao: z.string().optional().or(z.literal("")),
  preco_venda: z.coerce.number().min(0, "Preço de venda inválido"),
  preco_custo: z.coerce.number().min(0, "Preço de custo inválido"),
  quantidade_estoque: z.coerce.number().int().min(0, "Quantidade inválida"),
  unidade_medida: z.string().min(1, "Unidade é obrigatória"),
  grupo_id: z.string().nullable(),
  ativo: z.boolean(),
  ncm: z.string().length(8, "NCM deve ter 8 dígitos").regex(/^\d+$/, "NCM deve conter apenas números").optional().or(z.literal("")),
  cest: z.string().optional().or(z.literal("")),
  cfop: z.string().optional().or(z.literal("")),
  origem_mercadoria: z.coerce.number().min(0).max(8),
  cst_csosn: z.string().optional().or(z.literal("")),
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

const ORIGENS_MERCADORIA = [
  { value: 0, label: "0 - Nacional" },
  { value: 1, label: "1 - Estrangeira (Importação direta)" },
  { value: 2, label: "2 - Estrangeira (Adquirida no mercado interno)" },
  { value: 3, label: "3 - Nacional (Conteúdo importado > 40%)" },
  { value: 4, label: "4 - Nacional (Conforme processos básicos)" },
  { value: 5, label: "5 - Nacional (Conteúdo importado < 40%)" },
  { value: 6, label: "6 - Estrangeira (Import. direta, sem similar nacional)" },
  { value: 7, label: "7 - Estrangeira (Merc. interno, sem similar nacional)" },
  { value: 8, label: "8 - Nacional (Conteúdo importado > 70%)" },
];

const CST_CSOSN_OPTIONS = [
  { value: "00", label: "00 - Tributada integralmente" },
  { value: "10", label: "10 - Tributada com ICMS ST" },
  { value: "20", label: "20 - Com redução de base de cálculo" },
  { value: "30", label: "30 - Isenta/Não tributada com ICMS ST" },
  { value: "40", label: "40 - Isenta" },
  { value: "41", label: "41 - Não tributada" },
  { value: "50", label: "50 - Suspensão" },
  { value: "51", label: "51 - Diferimento" },
  { value: "60", label: "60 - ICMS cobrado anteriormente por ST" },
  { value: "70", label: "70 - Redução de base + ICMS ST" },
  { value: "90", label: "90 - Outras" },
  { value: "101", label: "101 - CSOSN - Tributada com permissão de crédito" },
  { value: "102", label: "102 - CSOSN - Tributada sem permissão de crédito" },
  { value: "103", label: "103 - CSOSN - Isenção do ICMS" },
  { value: "201", label: "201 - CSOSN - Tributada com ST e crédito" },
  { value: "202", label: "202 - CSOSN - Tributada com ST sem crédito" },
  { value: "203", label: "203 - CSOSN - Isenção com ST" },
  { value: "300", label: "300 - CSOSN - Imune" },
  { value: "400", label: "400 - CSOSN - Não tributada" },
  { value: "500", label: "500 - CSOSN - ICMS cobrado anteriormente por ST" },
  { value: "900", label: "900 - CSOSN - Outros" },
];

interface ProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
}

// Currency mask helpers
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return Number(digits) / 100;
}

export function ProdutoModal({ open, onOpenChange, produto }: ProdutoModalProps) {
  const { data: grupos = [] } = useGruposProdutos();
  const { data: allProdutos = [] } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const [skuError, setSkuError] = useState<string | null>(null);
  const [precoCustoDisplay, setPrecoCustoDisplay] = useState("R$ 0,00");
  const [precoVendaDisplay, setPrecoVendaDisplay] = useState("R$ 0,00");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      sku: "",
      marca: "",
      descricao: "",
      preco_venda: 0,
      preco_custo: 0,
      quantidade_estoque: 0,
      unidade_medida: "UN",
      grupo_id: null,
      ativo: true,
      ncm: "00000000",
      cest: "",
      cfop: "5102",
      origem_mercadoria: 0,
      cst_csosn: "102",
    },
  });

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        sku: produto.sku,
        marca: (produto as any).marca || "",
        descricao: (produto as any).descricao || "",
        preco_venda: produto.preco_venda,
        preco_custo: produto.preco_custo,
        quantidade_estoque: produto.quantidade_estoque,
        unidade_medida: produto.unidade_medida,
        grupo_id: produto.grupo_id,
        ativo: produto.ativo,
        ncm: produto.ncm || "00000000",
        cest: produto.cest || "",
        cfop: produto.cfop || "5102",
        origem_mercadoria: produto.origem_mercadoria ?? 0,
        cst_csosn: produto.cst_csosn || "102",
      });
      setPrecoCustoDisplay(formatCurrency(produto.preco_custo));
      setPrecoVendaDisplay(formatCurrency(produto.preco_venda));
    } else {
      form.reset({
        nome: "",
        sku: "",
        marca: "",
        descricao: "",
        preco_venda: 0,
        preco_custo: 0,
        quantidade_estoque: 0,
        unidade_medida: "UN",
        grupo_id: null,
        ativo: true,
        ncm: "00000000",
        cest: "",
        cfop: "5102",
        origem_mercadoria: 0,
        cst_csosn: "102",
      });
      setPrecoCustoDisplay("R$ 0,00");
      setPrecoVendaDisplay("R$ 0,00");
    }
    setSkuError(null);
  }, [produto, form, open]);

  const validateSku = (sku: string) => {
    if (!sku.trim()) {
      setSkuError(null);
      return;
    }
    const exists = allProdutos.some(
      (p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== produto?.id
    );
    setSkuError(exists ? "Código já cadastrado" : null);
  };

  const onSubmit = async (data: FormData) => {
    // Revalidate SKU before submit
    const skuExists = allProdutos.some(
      (p) => p.sku.toLowerCase() === data.sku.toLowerCase() && p.id !== produto?.id
    );
    if (skuExists) {
      setSkuError("Código já cadastrado");
      return;
    }

    try {
      const produtoData = {
        nome: data.nome,
        sku: data.sku,
        marca: data.marca || null,
        descricao: data.descricao || null,
        preco_venda: data.preco_venda,
        preco_custo: data.preco_custo,
        quantidade_estoque: data.quantidade_estoque,
        unidade_medida: data.unidade_medida,
        grupo_id: data.grupo_id,
        ativo: data.ativo,
        ncm: data.ncm || "00000000",
        cest: data.cest || null,
        cfop: data.cfop || "5102",
        origem_mercadoria: data.origem_mercadoria,
        cst_csosn: data.cst_csosn || "102",
      };

      if (produto) {
        await updateProduto.mutateAsync({ id: produto.id, ...produtoData });
        toast.success("Produto atualizado com sucesso");
      } else {
        await createProduto.mutateAsync(produtoData);
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
                      <Input
                        placeholder="Ex: FLT-001"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validateSku(e.target.value);
                        }}
                        className={skuError ? "border-destructive" : ""}
                      />
                    </FormControl>
                    {skuError && (
                      <p className="text-xs text-destructive font-medium">{skuError}</p>
                    )}
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

            <FormField
              control={form.control}
              name="marca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Acqua Nobilis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Dados Fiscais</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ncm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NCM</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000000"
                          maxLength={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        8 dígitos numéricos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEST</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0000000"
                          maxLength={7}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Opcional, 7 dígitos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cfop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CFOP Padrão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "5102"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione CFOP" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5102">5102 - Venda de mercadoria</SelectItem>
                        <SelectItem value="5405">5405 - Venda com ST</SelectItem>
                        <SelectItem value="5933">5933 - Prestação de serviço</SelectItem>
                        <SelectItem value="6102">6102 - Venda interestadual</SelectItem>
                        <SelectItem value="6108">6108 - Venda interestadual não contribuinte</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Código fiscal usado na emissão de NF
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="origem_mercadoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem da Mercadoria</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIGENS_MERCADORIA.map((origem) => (
                          <SelectItem key={origem.value} value={String(origem.value)}>
                            {origem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cst_csosn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CST / CSOSN</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "102"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione CST/CSOSN" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CST_CSOSN_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      CST para Lucro Real/Presumido, CSOSN para Simples Nacional
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={createProduto.isPending || updateProduto.isPending || !!skuError}
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
