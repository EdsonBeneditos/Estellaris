import { FileText, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useContratosVencer } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface WidgetContratosVencerProps {
  enabled: boolean;
}

export function WidgetContratosVencer({ enabled }: WidgetContratosVencerProps) {
  const { data: contratos = [], isLoading } = useContratosVencer(enabled);
  const navigate = useNavigate();

  if (!enabled) return null;

  const handleClienteClick = (clienteId: string) => {
    navigate(`/clientes?expandir=${clienteId}`);
  };

  const getUrgencyBadge = (diasRestantes: number) => {
    if (diasRestantes <= 7) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      );
    }
    if (diasRestantes <= 30) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {diasRestantes} dias
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {diasRestantes} dias
      </Badge>
    );
  };

  return (
    <Card className="relative bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] hover:z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-700 dark:text-zinc-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Contratos a Vencer (60 dias)
          </div>
          {contratos.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {contratos.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : contratos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum contrato vencendo</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {contratos.map((contrato) => (
                <div
                  key={contrato.id}
                  onClick={() => handleClienteClick(contrato.cliente_id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-zinc-100 truncate">
                      {contrato.clienteNome}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{contrato.servico_prestado}</span>
                      <span>•</span>
                      <span>{formatCurrency(Number(contrato.valor))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vence: {contrato.data_fim && format(
                        new Date(contrato.data_fim + "T00:00:00"),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 ml-2">
                    {getUrgencyBadge(contrato.diasRestantes)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
