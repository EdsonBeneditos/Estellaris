import { Calendar, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useProximasVisitas } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WidgetProximasVisitasProps {
  enabled: boolean;
}

export function WidgetProximasVisitas({ enabled }: WidgetProximasVisitasProps) {
  const { data: visitas = [], isLoading } = useProximasVisitas(enabled);
  const navigate = useNavigate();

  if (!enabled) return null;

  const handleClienteClick = (clienteId: string) => {
    navigate(`/clientes?expandir=${clienteId}`);
  };

  const getStatusBadge = (status: "atrasada" | "hoje" | "proxima", diasAte: number) => {
    if (status === "atrasada") {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {Math.abs(diasAte)} dia(s) atraso
        </Badge>
      );
    }
    if (status === "hoje") {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Hoje
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Em {diasAte} dia(s)
      </Badge>
    );
  };

  return (
    <Card className="relative bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] hover:z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-700 dark:text-zinc-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Próximas Visitas
          </div>
          {visitas.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {visitas.length}
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
        ) : visitas.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma visita agendada</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {visitas.map((visita) => (
                <div
                  key={visita.id}
                  onClick={() => handleClienteClick(visita.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-zinc-100 truncate">
                      {visita.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {visita.proxima_visita && format(
                        new Date(visita.proxima_visita + "T00:00:00"),
                        "dd 'de' MMM",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 ml-2">
                    {getStatusBadge(visita.status, visita.diasAte)}
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
