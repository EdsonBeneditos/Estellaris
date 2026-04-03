import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, DollarSign, Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useOrcamentos, Orcamento } from "@/hooks/useOrcamentos";
import { EfetivarRecebimentoModal } from "./EfetivarRecebimentoModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AguardandoFaturamentoProps {
  caixaId?: string | null;
}

export function AguardandoFaturamento({ caixaId }: AguardandoFaturamentoProps) {
  const { data: orcamentos } = useOrcamentos();
  const queryClient = useQueryClient();
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelOrcamento, setCancelOrcamento] = useState<Orcamento | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const pendentes = orcamentos?.filter(
    (o) => o.status === "Aprovado" && (o.status_financeiro === "pendente" || !o.status_financeiro)
  ) || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCancelConfirm = async () => {
    if (!cancelOrcamento) return;
    setCanceling(true);
    try {
      await supabase
        .from("orcamentos")
        .update({ status: "Cancelado", status_financeiro: "cancelado" })
        .eq("id", cancelOrcamento.id);

      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento cancelado com sucesso");
      setCancelOpen(false);
    } catch {
      toast.error("Erro ao cancelar orçamento");
    } finally {
      setCanceling(false);
    }
  };

  if (pendentes.length === 0) return null;

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Aguardando Faturamento
            <Badge variant="secondary" className="ml-auto">
              {pendentes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendentes.map((orc) => (
            <div
              key={orc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    #{String(orc.numero_orcamento).padStart(5, "0")} — {orc.cliente_nome || "Cliente"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(orc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(orc.valor_total)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => {
                    setSelectedOrcamento(orc);
                    setModalOpen(true);
                  }}
                >
                  <DollarSign className="h-3 w-3" />
                  Efetivar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs text-destructive hover:text-destructive hover:border-destructive/50"
                  onClick={() => {
                    setCancelOrcamento(orc);
                    setCancelOpen(true);
                  }}
                >
                  <X className="h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <EfetivarRecebimentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orcamento={selectedOrcamento}
        caixaId={caixaId}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o orçamento{" "}
              #{cancelOrcamento ? String(cancelOrcamento.numero_orcamento).padStart(5, "0") : ""}?
              O orçamento voltará para a lista de orçamentos com status "Cancelado"
              e uma notificação será gerada para correção ou exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling ? "Cancelando..." : "Confirmar Cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
