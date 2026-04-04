import { Palmtree, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useColaboradoresProximosFerias, calculateMonthsSinceAdmission } from "@/hooks/useColaboradores";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WidgetColaboradoresFeriasProps {
  visible?: boolean;
}

export function WidgetColaboradoresFerias({ visible = true }: WidgetColaboradoresFeriasProps) {
  const { data: colaboradores = [], isLoading } = useColaboradoresProximosFerias();

  if (!visible) return null;

  if (isLoading) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (colaboradores.length === 0) {
    return null;
  }

  return (
    <Card className="relative border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] hover:z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
          <Palmtree className="h-5 w-5" />
          Colaboradores Próximos de Férias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {colaboradores.slice(0, 5).map((colaborador) => {
            const meses = calculateMonthsSinceAdmission(colaborador.data_admissao);
            return (
              <div
                key={colaborador.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {colaborador.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                    {meses} meses
                  </Badge>
                  {colaborador.data_admissao && (
                    <span className="text-xs text-muted-foreground">
                      Adm: {format(parseISO(colaborador.data_admissao), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {colaboradores.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{colaboradores.length - 5} colaborador(es) próximos de férias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
