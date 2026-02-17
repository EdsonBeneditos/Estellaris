import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrcamentos, Orcamento } from "@/hooks/useOrcamentos";
import { EfetivarRecebimentoModal } from "./EfetivarRecebimentoModal";

interface AguardandoFaturamentoProps {
  caixaId?: string | null;
}

export function AguardandoFaturamento({ caixaId }: AguardandoFaturamentoProps) {
  const { data: orcamentos } = useOrcamentos();
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pendentes = orcamentos?.filter(
    (o) => o.status === "Aprovado" && (o.status_financeiro === "pendente" || !o.status_financeiro)
  ) || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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
              <div className="flex items-center gap-3 shrink-0">
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
    </>
  );
}
