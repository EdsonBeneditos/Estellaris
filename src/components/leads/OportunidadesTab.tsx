import { useState } from "react";
import {
  Plus,
  TrendingUp,
  Trophy,
  XCircle,
  Edit2,
  Trash2,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useOportunidades,
  useCreateOportunidade,
  useUpdateOportunidade,
  useDeleteOportunidade,
  type Oportunidade,
  type OportunidadeItem,
} from "@/hooks/useOportunidades";
import { useActiveVendedores } from "@/hooks/useSettings";
import { useProdutos } from "@/hooks/useEstoque";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  Oportunidade["status"],
  { label: string; color: string; dot: string }
> = {
  Aberta:            { label: "Aberta",           color: "bg-blue-500/10 text-blue-600 border-blue-200",      dot: "bg-blue-500" },
  "Proposta Enviada":{ label: "Proposta Enviada", color: "bg-amber-500/10 text-amber-600 border-amber-200",   dot: "bg-amber-500" },
  "Em Negociação":   { label: "Em Negociação",    color: "bg-purple-500/10 text-purple-600 border-purple-200",dot: "bg-purple-500" },
  Ganha:             { label: "Ganha",            color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  Perdida:           { label: "Perdida",          color: "bg-red-500/10 text-red-600 border-red-200",         dot: "bg-red-500" },
};

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatCurrencyInput(val: number): string {
  if (!val) return "";
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ItemLine {
  produto_id: string;
  produto_nome: string;
  produto_sku: string;
  unidade_medida: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

const emptyLine = (): ItemLine => ({
  produto_id: "",
  produto_nome: "",
  produto_sku: "",
  unidade_medida: "UN",
  quantidade: 1,
  preco_unitario: 0,
  subtotal: 0,
});

interface Props {
  leadId: string;
}

export function OportunidadesTab({ leadId }: Props) {
  const { data: oportunidades = [], isLoading } = useOportunidades(leadId);
  const createOp = useCreateOportunidade();
  const updateOp = useUpdateOportunidade();
  const deleteOp = useDeleteOportunidade();
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: produtos = [] } = useProdutos();
  const produtosAtivos = produtos.filter((p) => p.ativo);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Oportunidade | null>(null);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [valorDisplay, setValorDisplay] = useState("");
  const [items, setItems] = useState<ItemLine[]>([]);

  const openNew = () => {
    setEditingOp(null);
    setTitulo(""); setDescricao(""); setVendedor(""); setValorDisplay(""); setItems([]);
    setIsFormOpen(true);
  };

  const openEdit = (op: Oportunidade) => {
    setEditingOp(op);
    setTitulo(op.titulo);
    setDescricao(op.descricao || "");
    setVendedor(op.vendedor || "");
    setValorDisplay(formatCurrencyInput(op.valor_estimado));
    setItems(
      (op.itens || []).map((i) => ({
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        produto_sku: i.produto_sku,
        unidade_medida: i.unidade_medida,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        subtotal: i.subtotal,
      }))
    );
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingOp(null);
  };

  // Item helpers
  const totalItens = items.reduce((s, i) => s + i.subtotal, 0);

  const addItem = () => setItems((prev) => [...prev, emptyLine()]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<ItemLine>) => {
    setItems((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], ...patch };
      updated.subtotal = updated.quantidade * updated.preco_unitario;
      next[idx] = updated;
      return next;
    });
  };

  const selectProduto = (idx: number, produtoId: string) => {
    const p = produtosAtivos.find((p) => p.id === produtoId);
    if (!p) return;
    updateItem(idx, {
      produto_id: p.id,
      produto_nome: p.nome,
      produto_sku: p.sku,
      unidade_medida: p.unidade_medida || "UN",
      preco_unitario: p.preco_venda,
      subtotal: (items[idx]?.quantidade || 1) * p.preco_venda,
    });
    // Sync valor display with items total only if user hasn't manually changed it
    setTimeout(() => {
      const newTotal = items.reduce((s, it, i) => {
        if (i === idx) return s + (items[idx]?.quantidade || 1) * p.preco_venda;
        return s + it.subtotal;
      }, 0);
      setValorDisplay(formatCurrencyInput(newTotal));
    }, 0);
  };

  const handleValorBlur = (raw: string) => {
    const n = parseCurrencyInput(raw);
    setValorDisplay(n > 0 ? formatCurrencyInput(n) : "");
  };

  const resolvedValor = parseCurrencyInput(valorDisplay) || totalItens;

  const handleSave = async () => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      vendedor: vendedor || null,
      valor_estimado: resolvedValor,
      itens: items.map((i) => ({
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        produto_sku: i.produto_sku,
        unidade_medida: i.unidade_medida,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        subtotal: i.subtotal,
      })) as OportunidadeItem[],
    };

    try {
      if (editingOp) {
        await updateOp.mutateAsync({ id: editingOp.id, data: payload });
        toast.success("Oportunidade atualizada!");
      } else {
        await createOp.mutateAsync({ lead_id: leadId, ...payload });
        toast.success("Oportunidade criada!");
      }
      closeForm();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar oportunidade");
    }
  };

  const handleDelete = async (op: Oportunidade) => {
    try {
      await deleteOp.mutateAsync({ id: op.id, leadId: op.lead_id });
      toast.success("Oportunidade removida!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover");
    }
  };

  const isSaving = createOp.isPending || updateOp.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const totalAberto = oportunidades
    .filter((o) => o.status !== "Perdida" && o.status !== "Ganha")
    .reduce((s, o) => s + (o.valor_estimado || 0), 0);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {totalAberto > 0 && (
            <><strong>{formatCurrency(totalAberto)}</strong> em pipeline</>
          )}
        </span>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 pr-1">
        {oportunidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade registrada</p>
            <p className="text-xs text-muted-foreground/60">
              Registre propostas e negociações associadas a este lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {oportunidades.map((op) => {
              const cfg = STATUS_CONFIG[op.status];
              const isClosed = op.status === "Ganha" || op.status === "Perdida";

              return (
                <div key={op.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug">{op.titulo}</p>
                      {op.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{op.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={cn("text-xs gap-1.5 border", cfg.color)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </Badge>
                      {!isClosed && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(op)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!isClosed && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Oportunidade</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover "{op.titulo}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(op)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {op.valor_estimado > 0 && (
                      <span className="font-semibold text-foreground">{formatCurrency(op.valor_estimado)}</span>
                    )}
                    {op.vendedor && <span>{op.vendedor}</span>}
                    {op.itens?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {op.itens.length} produto(s)
                      </span>
                    )}
                    {op.data_fechamento && (
                      <span>
                        Fechado {format(new Date(op.data_fechamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    <span className="ml-auto">
                      {format(new Date(op.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>

                  {op.status === "Perdida" && op.motivo_perda && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500/80">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {op.motivo_perda}
                    </div>
                  )}
                  {op.status === "Ganha" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Trophy className="h-3.5 w-3.5 shrink-0" />
                      Negócio fechado — orçamento gerado automaticamente
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { if (!v) closeForm(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {editingOp ? "Editar Oportunidade" : "Nova Oportunidade"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-2 pr-1">
              {/* Título */}
              <div className="space-y-1.5">
                <Label htmlFor="op-titulo">Título *</Label>
                <Input
                  id="op-titulo"
                  placeholder="Ex: Proposta de tratamento de efluentes"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label htmlFor="op-desc">Descrição</Label>
                <Textarea
                  id="op-desc"
                  placeholder="Detalhes da negociação..."
                  rows={2}
                  className="resize-none"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              {/* Vendedor */}
              <div className="space-y-1.5">
                <Label>Vendedor</Label>
                <Select value={vendedor} onValueChange={setVendedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Sem vendedor —</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produtos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Produtos</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
                    <Plus className="h-3.5 w-3.5" /> Adicionar Produto
                  </Button>
                </div>

                {items.length > 0 && (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Select
                              value={item.produto_id || "_none"}
                              onValueChange={(v) => v !== "_none" && selectProduto(idx, v)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecionar produto..." />
                              </SelectTrigger>
                              <SelectContent>
                                {produtosAtivos.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nome} {p.sku ? `(${p.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {item.produto_id && (
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Qtd.</Label>
                              <Input
                                type="number" min={1}
                                className="h-7 text-xs"
                                value={item.quantidade}
                                onChange={(e) => {
                                  const q = Math.max(1, parseInt(e.target.value) || 1);
                                  updateItem(idx, { quantidade: q });
                                  const newTotal = items.reduce((s, it, i) =>
                                    s + (i === idx ? q * it.preco_unitario : it.subtotal), 0);
                                  setValorDisplay(formatCurrencyInput(newTotal));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Preço Unit.</Label>
                              <Input
                                className="h-7 text-xs"
                                value={formatCurrencyInput(item.preco_unitario)}
                                onChange={(e) => {
                                  const p = parseCurrencyInput(e.target.value);
                                  updateItem(idx, { preco_unitario: p });
                                  const newTotal = items.reduce((s, it, i) =>
                                    s + (i === idx ? item.quantidade * p : it.subtotal), 0);
                                  setValorDisplay(formatCurrencyInput(newTotal));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Subtotal</Label>
                              <div className="h-7 flex items-center px-2 text-xs font-medium text-foreground bg-muted rounded-md">
                                {formatCurrency(item.subtotal)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="px-3 py-2 flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        Total produtos: <strong className="text-foreground">{formatCurrency(totalItens)}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Valor da Oportunidade */}
              <div className="space-y-1.5">
                <Label htmlFor="op-valor">Valor da Oportunidade (R$) *</Label>
                <Input
                  id="op-valor"
                  placeholder="0,00"
                  value={valorDisplay}
                  onChange={(e) => setValorDisplay(e.target.value)}
                  onBlur={(e) => handleValorBlur(e.target.value)}
                  className="font-mono"
                />
                {items.length > 0 && parseCurrencyInput(valorDisplay) !== totalItens && totalItens > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total dos produtos: {formatCurrency(totalItens)}
                    {" · "}
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => setValorDisplay(formatCurrencyInput(totalItens))}
                    >
                      usar esse valor
                    </button>
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !titulo.trim()}
              className="gap-1.5"
            >
              {isSaving ? "Salvando..." : editingOp ? "Salvar" : <><Plus className="h-4 w-4" />Criar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
