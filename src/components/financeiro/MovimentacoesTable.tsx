import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, User, UserCheck, Lock, FileText, XCircle, Loader2 } from "lucide-react";
import { MovimentacaoCaixa, useDeleteMovimentacao } from "@/hooks/useFinanceiro";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { EmitirNFModal } from "./EmitirNFModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface MovimentacoesTableProps {
  movimentacoes: MovimentacaoCaixa[];
  caixaId?: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const truncateEmail = (email: string | null) => {
  if (!email) return "—";
  const [local] = email.split("@");
  return local.length > 8 ? local.substring(0, 8) + "..." : local;
};

export function MovimentacoesTable({ movimentacoes, caixaId }: MovimentacoesTableProps) {
  const deleteMovimentacao = useDeleteMovimentacao();
  const [editMovimentacao, setEditMovimentacao] = useState<MovimentacaoCaixa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [emitirNFMov, setEmitirNFMov] = useState<MovimentacaoCaixa | null>(null);
  const [cancelNFMov, setCancelNFMov] = useState<MovimentacaoCaixa | null>(null);
  const [cancelJustificativa, setCancelJustificativa] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: profile } = useCurrentProfile();

  const handleCancelNF = async () => {
    if (!cancelNFMov || !cancelJustificativa.trim() || !profile) return;
    if (cancelJustificativa.length < 15) {
      toast.error("A justificativa deve ter pelo menos 15 caracteres.");
      return;
    }
    setIsCancelling(true);
    try {
      // Find the nota_id from logs
      const { data: logs } = await supabase
        .from("notas_fiscais_logs")
        .select("id")
        .eq("movimentacao_id", cancelNFMov.id)
        .eq("status", "Autorizada")
        .limit(1);

      // Find the actual nota fiscal
      const { data: notas } = await supabase
        .from("notas_fiscais")
        .select("id")
        .eq("status", "Autorizada")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(1);

      const notaId = notas?.[0]?.id;
      if (!notaId) {
        toast.error("Nota fiscal autorizada não encontrada para esta movimentação.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: {
          action: "cancel_nfe",
          nota_id: notaId,
          organization_id: profile.organization_id,
          justificativa: cancelJustificativa,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Nota fiscal cancelada com sucesso!");
      } else {
        toast.error("Erro ao cancelar nota", { description: data?.error });
      }

      setCancelNFMov(null);
      setCancelJustificativa("");
    } catch (error: any) {
      toast.error("Erro ao cancelar NF", { description: error.message });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMovimentacao.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (movimentacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma movimentação encontrada no período selecionado.</p>
      </div>
    );
  }

  return (
    <>
      {/* Aviso de auditoria imutável */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50 mb-3">
        <Lock className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Registros de auditoria são automáticos e imutáveis para segurança da empresa.</span>
      </div>

      <div className="rounded-md border border-border/50 max-h-[500px] overflow-auto relative">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
            <TableRow className="bg-muted/30">
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="text-right w-[110px]">Valor</TableHead>
              <TableHead className="min-w-[130px]">Categoria</TableHead>
              <TableHead className="w-[90px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Pagamento</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="font-medium">Forma de Pagamento</p>
                      <p className="text-xs mt-1">Método utilizado na transação. Movimentações <strong>Conciliadas</strong> foram confirmadas no extrato bancário. <strong>Pendentes</strong> ainda aguardam confirmação.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-[100px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <User className="h-3.5 w-3.5" />
                        Quem Fez
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Usuário que realizou a movimentação</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-[100px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <UserCheck className="h-3.5 w-3.5" />
                        Autorizou
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Usuário que autorizou a movimentação</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentacoes.map((mov) => (
              <TableRow key={mov.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {mov.tipo === "Entrada" ? (
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {format(new Date(mov.data_hora), "dd/MM/yy", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(mov.data_hora), "HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    mov.tipo === "Entrada" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {mov.tipo === "Entrada" ? "+" : "-"}
                  {formatCurrency(Number(mov.valor))}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{mov.categoria_nome || "Sem categoria"}</div>
                    {mov.descricao && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px] cursor-help">
                              {mov.descricao}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[300px]">
                            <p>{mov.descricao}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {mov.forma_pagamento}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                          <User className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{truncateEmail(mov.usuario_email)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">Realizado por:</p>
                        <p>{mov.usuario_email || "Não identificado"}</p>
                        {mov.realizado_por && (
                          <p className="text-xs text-muted-foreground mt-1">ID: {mov.realizado_por}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{truncateEmail(mov.autorizado_por_email)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">Autorizado por:</p>
                        <p>{mov.autorizado_por_email || "Não requer autorização"}</p>
                        {mov.autorizado_por && (
                          <p className="text-xs text-muted-foreground mt-1">ID: {mov.autorizado_por}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditMovimentacao(mov)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEmitirNFMov(mov)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Emitir NF
                      </DropdownMenuItem>
                      {mov.tipo === "Entrada" && (
                        <DropdownMenuItem onClick={() => setCancelNFMov(mov)}>
                          <XCircle className="h-4 w-4 mr-2 text-amber-500" />
                          Cancelar NF
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteId(mov.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Editar */}
      <MovimentacaoModal
        open={!!editMovimentacao}
        onOpenChange={(open) => !open && setEditMovimentacao(null)}
        movimentacao={editMovimentacao}
        caixaId={caixaId}
      />

      {/* Modal Emitir NF */}
      <EmitirNFModal
        open={!!emitirNFMov}
        onOpenChange={(open) => !open && setEmitirNFMov(null)}
        movimentacao={emitirNFMov}
      />

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Cancelar NF */}
      <Dialog open={!!cancelNFMov} onOpenChange={(open) => { if (!open) { setCancelNFMov(null); setCancelJustificativa(""); } }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-500" />
              Cancelar Nota Fiscal
            </DialogTitle>
            <DialogDescription>
              Informe a justificativa para o cancelamento. Mínimo de 15 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                placeholder="Motivo do cancelamento da nota fiscal..."
                value={cancelJustificativa}
                onChange={(e) => setCancelJustificativa(e.target.value)}
                disabled={isCancelling}
                className="bg-background resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {cancelJustificativa.length}/15 caracteres mínimos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelNFMov(null); setCancelJustificativa(""); }} disabled={isCancelling}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelNF}
              disabled={isCancelling || cancelJustificativa.length < 15}
              className="gap-2"
            >
              {isCancelling ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Cancelando...</>
              ) : (
                <><XCircle className="h-4 w-4" /> Confirmar Cancelamento</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
