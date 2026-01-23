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
import { MoreHorizontal, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, User } from "lucide-react";
import { MovimentacaoCaixa, useDeleteMovimentacao } from "@/hooks/useFinanceiro";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

export function MovimentacoesTable({ movimentacoes, caixaId }: MovimentacoesTableProps) {
  const deleteMovimentacao = useDeleteMovimentacao();
  const [editMovimentacao, setEditMovimentacao] = useState<MovimentacaoCaixa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentacoes.map((mov) => (
              <TableRow key={mov.id} className="hover:bg-muted/20">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      mov.tipo === "Entrada"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-red-500/30 bg-red-500/10 text-red-600"
                    )}
                  >
                    {mov.tipo === "Entrada" ? (
                      <ArrowUpCircle className="h-3 w-3" />
                    ) : (
                      <ArrowDownCircle className="h-3 w-3" />
                    )}
                    {mov.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[250px] truncate">
                  {mov.descricao || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {mov.categoria_nome || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {mov.forma_pagamento}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    mov.tipo === "Entrada" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {mov.tipo === "Entrada" ? "+" : "-"}
                  {formatCurrency(Number(mov.valor))}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(mov.data_hora), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {mov.usuario_email ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="max-w-[100px] truncate">
                              {mov.usuario_email.split("@")[0]}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{mov.usuario_email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground/50 text-sm">-</span>
                  )}
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
    </>
  );
}
