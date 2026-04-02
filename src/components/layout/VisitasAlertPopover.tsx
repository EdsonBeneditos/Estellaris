import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVisitasAlerts, useVisitasCount, VisitaAlerta } from "@/hooks/useVisitasAlerts";
import { cn } from "@/lib/utils";

interface VisitaItemProps {
  alerta: VisitaAlerta;
  onNavigate: (clienteId: string) => void;
}

function VisitaItem({ alerta, onNavigate }: VisitaItemProps) {
  const getStatusConfig = () => {
    switch (alerta.status) {
      case "atrasada":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50 dark:bg-red-950/40",
          iconColor: "text-red-500 dark:text-red-400",
          textColor: "text-red-700 dark:text-red-400",
          label: alerta.diasAte === -1 ? "1 dia de atraso" : `${Math.abs(alerta.diasAte)} dias de atraso`,
        };
      case "hoje":
        return {
          icon: Clock,
          bgColor: "bg-orange-50 dark:bg-orange-950/40",
          iconColor: "text-orange-500 dark:text-orange-400",
          textColor: "text-orange-700 dark:text-orange-400",
          label: "Hoje",
        };
      case "proximos3dias":
        return {
          icon: CalendarDays,
          bgColor: "bg-amber-50 dark:bg-amber-950/40",
          iconColor: "text-amber-500 dark:text-amber-400",
          textColor: "text-amber-700 dark:text-amber-400",
          label: alerta.diasAte === 1 ? "Amanhã" : `Em ${alerta.diasAte} dias`,
        };
      default:
        return {
          icon: CalendarDays,
          bgColor: "bg-slate-100 dark:bg-slate-800/60",
          iconColor: "text-slate-500 dark:text-slate-400",
          textColor: "text-slate-700 dark:text-slate-300",
          label: `Em ${alerta.diasAte} dias`,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      onClick={() => onNavigate(alerta.id)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        config.bgColor,
        "hover:opacity-80 border border-transparent dark:border-white/5"
      )}
    >
      <div className={cn("p-2 rounded-full", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{alerta.nome}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(alerta.proxima_visita), "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={cn("text-xs whitespace-nowrap", config.textColor)}>
          {config.label}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

export function VisitasAlertPopover() {
  const navigate = useNavigate();
  const { data: alertas = [], isLoading } = useVisitasAlerts();
  const { total, atrasadas } = useVisitasCount();

  const handleNavigateToCliente = (clienteId: string) => {
    // Navegar para clientes com o ID do cliente como parâmetro
    navigate(`/clientes?expandir=${clienteId}`);
  };

  const atrasadasList = alertas.filter((a) => a.status === "atrasada");
  const hojeList = alertas.filter((a) => a.status === "hoje");
  const proximosList = alertas.filter(
    (a) => a.status === "proximos3dias" || a.status === "proximos7dias"
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <CalendarDays className="h-5 w-5" />
          {total > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold",
                atrasadas > 0 ? "bg-red-500 animate-pulse" : "bg-orange-500"
              )}
            >
              {total > 99 ? "99+" : total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Visitas Agendadas</h3>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Nenhuma visita pendente"
              : `${total} visita${total > 1 ? "s" : ""} pendente${total > 1 ? "s" : ""}`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : total === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma visita agendada para os próximos 7 dias
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-4">
              {/* Atrasadas */}
              {atrasadasList.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Atrasadas ({atrasadasList.length})
                  </p>
                  {atrasadasList.map((alerta) => (
                    <VisitaItem
                      key={alerta.id}
                      alerta={alerta}
                      onNavigate={handleNavigateToCliente}
                    />
                  ))}
                </div>
              )}

              {/* Hoje */}
              {hojeList.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    Hoje ({hojeList.length})
                  </p>
                  {hojeList.map((alerta) => (
                    <VisitaItem
                      key={alerta.id}
                      alerta={alerta}
                      onNavigate={handleNavigateToCliente}
                    />
                  ))}
                </div>
              )}

              {/* Próximos dias */}
              {proximosList.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Próximos 7 dias ({proximosList.length})
                  </p>
                  {proximosList.map((alerta) => (
                    <VisitaItem
                      key={alerta.id}
                      alerta={alerta}
                      onNavigate={handleNavigateToCliente}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/clientes")}
          >
            Ver todos os clientes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
