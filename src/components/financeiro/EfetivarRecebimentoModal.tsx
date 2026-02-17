import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategorias } from "@/hooks/useFinanceiro";
import { useUpdateOrcamento, Orcamento } from "@/hooks/useOrcamentos";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const formasPagamento = [
  "Dinheiro",
  "Pix",
  "Cartão Débito",
  "Cartão Crédito",
  "Boleto",
  "Transferência",
];

interface EfetivarRecebimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
  caixaId?: string | null;
}

export function EfetivarRecebimentoModal({
  open,
  onOpenChange,
  orcamento,
  caixaId,
}: EfetivarRecebimentoModalProps) {
  const { user } = useAuthContext();
  const { data: categorias } = useCategorias();
  const updateOrcamento = useUpdateOrcamento();
  const queryClient = useQueryClient();

  const [categoriaId, setCategoriaId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isPending, setIsPending] = useState(false);

  const categoriasEntrada = categorias?.filter((c) => c.tipo === "Entrada") || [];

  useEffect(() => {
    if (open) {
      setCategoriaId("");
      setFormaPagamento("Dinheiro");
      setDataRecebimento(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!orcamento) return;
    setIsPending(true);

    try {
      const categoriaSelecionada = categorias?.find((c) => c.id === categoriaId);

      // Update the existing movimentação linked to this orcamento
      const { data: movExistente } = await supabase
        .from("movimentacoes_caixa")
        .select("id")
        .eq("orcamento_id", orcamento.id)
        .maybeSingle();

      if (movExistente) {
        await supabase
          .from("movimentacoes_caixa")
          .update({
            categoria_id: categoriaId || null,
            categoria_nome: categoriaSelecionada?.nome || "Venda de Produtos",
            forma_pagamento: formaPagamento,
            data_hora: new Date(dataRecebimento).toISOString(),
            caixa_id: caixaId || null,
          })
          .eq("id", movExistente.id);
      }

      // Update orcamento status_financeiro
      await updateOrcamento.mutateAsync({
        id: orcamento.id,
        data: { status_financeiro: "conciliado" } as any,
      });

      queryClient.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Recebimento efetivado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao efetivar recebimento", { description: error.message });
    } finally {
      setIsPending(false);
    }
  };

  if (!orcamento) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Efetivar Recebimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm font-medium">
              Orçamento #{String(orcamento.numero_orcamento).padStart(5, "0")}
            </p>
            <p className="text-xs text-muted-foreground">{orcamento.cliente_nome}</p>
            <p className="text-lg font-bold text-primary mt-1">
              {formatCurrency(orcamento.valor_total)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Categoria Financeira</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasEntrada.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data do Recebimento</Label>
            <Input
              type="date"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Processando..." : "Confirmar Recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
