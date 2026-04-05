import { useState } from "react";
import { Plus, TrendingUp, Trophy, XCircle, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  useOportunidades,
  useCreateOportunidade,
  useUpdateOportunidade,
  type Oportunidade,
} from "@/hooks/useOportunidades";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  Oportunidade["status"],
  { label: string; color: string; dot: string }
> = {
  Aberta:           { label: "Aberta",           color: "bg-blue-500/10 text-blue-600 border-blue-200",     dot: "bg-blue-500" },
  "Proposta Enviada":{ label: "Proposta Enviada", color: "bg-amber-500/10 text-amber-600 border-amber-200",  dot: "bg-amber-500" },
  "Em Negociação":  { label: "Em Negociação",    color: "bg-purple-500/10 text-purple-600 border-purple-200",dot: "bg-purple-500" },
  Ganha:            { label: "Ganha",             color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  Perdida:          { label: "Perdida",           color: "bg-red-500/10 text-red-600 border-red-200",        dot: "bg-red-500" },
};

const STATUS_OPTIONS: Oportunidade["status"][] = [
  "Aberta",
  "Proposta Enviada",
  "Em Negociação",
  "Ganha",
  "Perdida",
];

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  leadId: string;
}

export function OportunidadesTab({ leadId }: Props) {
  const { data: oportunidades = [], isLoading } = useOportunidades(leadId);
  const createOp = useCreateOportunidade();
  const updateOp = useUpdateOportunidade();

  // New oportunidade form state
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [vendedor, setVendedor] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Oportunidade["status"]>("Aberta");
  const [editMotivoPerda, setEditMotivoPerda] = useState("");

  const handleCreate = async () => {
    if (!titulo.trim()) { toast.error("Título é obrigatório"); return; }
    try {
      await createOp.mutateAsync({
        lead_id: leadId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        valor_estimado: parseFloat(valorEstimado.replace(",", ".")) || 0,
        vendedor: vendedor.trim() || null,
      });
      toast.success("Oportunidade criada!");
      setIsNewOpen(false);
      setTitulo(""); setDescricao(""); setValorEstimado(""); setVendedor("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar oportunidade");
    }
  };

  const startEdit = (op: Oportunidade) => {
    setEditingId(op.id);
    setEditStatus(op.status);
    setEditMotivoPerda(op.motivo_perda || "");
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (op: Oportunidade) => {
    if (editStatus === "Perdida" && !editMotivoPerda.trim()) {
      toast.error("Informe o motivo da perda");
      return;
    }
    try {
      await updateOp.mutateAsync({
        id: op.id,
        data: {
          status: editStatus,
          motivo_perda: editStatus === "Perdida" ? editMotivoPerda.trim() : null,
        },
      });
      toast.success("Oportunidade atualizada!");
      setEditingId(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    }
  };

  const totalAberto = oportunidades
    .filter((o) => o.status !== "Perdida")
    .reduce((s, o) => s + (o.valor_estimado || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {oportunidades.length > 0 && (
            <span>
              <strong>{formatCurrency(totalAberto)}</strong> em aberto
            </span>
          )}
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsNewOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 pr-1">
        {oportunidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade registrada</p>
            <p className="text-xs text-muted-foreground/60">
              Registre propostas, negociações e vendas associadas a este lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {oportunidades.map((op) => {
              const cfg = STATUS_CONFIG[op.status];
              const isEditing = editingId === op.id;

              return (
                <div
                  key={op.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  {/* Title & status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">{op.titulo}</p>
                      {op.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {op.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isEditing && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs gap-1.5 border", cfg.color)}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </Badge>
                      )}
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(op)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Value & dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {op.valor_estimado > 0 && (
                      <span className="font-medium text-foreground">
                        {formatCurrency(op.valor_estimado)}
                      </span>
                    )}
                    {op.vendedor && <span>{op.vendedor}</span>}
                    {op.data_fechamento && (
                      <span>
                        Fechado em{" "}
                        {format(new Date(op.data_fechamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    <span className="ml-auto">
                      {format(new Date(op.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Inline edit */}
                  {isEditing && (
                    <div className="pt-2 border-t border-border space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={editStatus}
                          onValueChange={(v) => setEditStatus(v as Oportunidade["status"])}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "h-2 w-2 rounded-full",
                                      STATUS_CONFIG[s].dot
                                    )}
                                  />
                                  {STATUS_CONFIG[s].label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {editStatus === "Perdida" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-destructive">Motivo da Perda *</Label>
                          <Input
                            className="h-8 text-sm"
                            placeholder="Ex: Preço, concorrência..."
                            value={editMotivoPerda}
                            onChange={(e) => setEditMotivoPerda(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1"
                          disabled={updateOp.isPending}
                          onClick={() => saveEdit(op)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show motivo_perda if Perdida */}
                  {op.status === "Perdida" && op.motivo_perda && !isEditing && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500/80">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {op.motivo_perda}
                    </div>
                  )}

                  {/* Show trophy if Ganha */}
                  {op.status === "Ganha" && !isEditing && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Trophy className="h-3.5 w-3.5 shrink-0" />
                      Negócio fechado!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Oportunidade Dialog */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Nova Oportunidade
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="op-titulo">Título *</Label>
              <Input
                id="op-titulo"
                placeholder="Ex: Proposta de licenciamento anual"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="op-desc">Descrição</Label>
              <Textarea
                id="op-desc"
                placeholder="Detalhes da oportunidade..."
                rows={3}
                className="resize-none"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="op-valor">Valor Estimado (R$)</Label>
                <Input
                  id="op-valor"
                  placeholder="0,00"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-vendedor">Vendedor</Label>
                <Input
                  id="op-vendedor"
                  placeholder="Nome do vendedor"
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createOp.isPending || !titulo.trim()}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {createOp.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
