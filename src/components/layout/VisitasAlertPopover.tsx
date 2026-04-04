import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, AlertCircle, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVisitasAlerts, useVisitasCount, VisitaAlerta } from "@/hooks/useVisitasAlerts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VisitaRealizadaDialogProps {
  alerta: VisitaAlerta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VisitaRealizadaDialog({ alerta, open, onOpenChange }: VisitaRealizadaDialogProps) {
  const queryClient = useQueryClient();
  const [novaData, setNovaData] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!alerta || !novaData) return;
    setSaving(true);
    try {
      await supabase
        .from("clientes")
        .update({ proxima_visita: format(novaData, "yyyy-MM-dd") })
        .eq("id", alerta.id);

      queryClient.invalidateQueries({ queryKey: ["visitas-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Visita registrada e nova data agendada!");
      onOpenChange(false);
      setNovaData(undefined);
    } catch {
      toast.error("Erro ao registrar visita");
    } finally {
      setSaving(false);
    }
  };

  const quickDates = [7, 14, 30, 60].map((d) => ({
    label: `+${d} dias`,
    date: addDays(new Date(), d),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Visita Realizada
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Marque a visita de <span className="font-semibold text-foreground">{alerta?.nome}</span> como realizada e agende a próxima data.
          </p>

          {/* Quick date buttons */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Atalhos rápidos</p>
            <div className="flex flex-wrap gap-2">
              {quickDates.map(({ label, date }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs",
                    novaData?.toDateString() === date.toDateString() && "bg-primary text-primary-foreground border-primary"
                  )}
                  onClick={() => setNovaData(date)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Ou escolha uma data</p>
            <Calendar
              mode="single"
              selected={novaData}
              onSelect={setNovaData}
              locale={ptBR}
              disabled={(d) => d < new Date()}
              className="rounded-md border p-2"
            />
          </div>

          {novaData && (
            <p className="text-sm text-center font-medium text-primary">
              Nova visita: {format(novaData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!novaData || saving}
          >
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VisitaItemProps {
  alerta: VisitaAlerta;
  onNavigate: (clienteId: string) => void;
  onRealize: (alerta: VisitaAlerta) => void;
}

function VisitaItem({ alerta, onNavigate, onRealize }: VisitaItemProps) {
  const [expanded, setExpanded] = useState(false);

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
    <div className={cn("rounded-lg border border-transparent dark:border-white/5 overflow-hidden", config.bgColor)}>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 p-3 transition-opacity hover:opacity-80 text-left"
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
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-3 pb-3 flex gap-2 border-t border-black/5 dark:border-white/5 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
            onClick={() => onRealize(alerta)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Visita realizada
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs gap-1 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
            onClick={() => onNavigate(alerta.id)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Ver cliente
          </Button>
        </div>
      )}
    </div>
  );
}

export function VisitasAlertPopover() {
  const navigate = useNavigate();
  const { data: alertas = [], isLoading } = useVisitasAlerts();
  const { total, atrasadas } = useVisitasCount();
  const [realizadaAlerta, setRealizadaAlerta] = useState<VisitaAlerta | null>(null);
  const [realizadaOpen, setRealizadaOpen] = useState(false);

  const handleNavigateToCliente = (clienteId: string) => {
    navigate(`/clientes?expandir=${clienteId}`);
  };

  const handleRealize = (alerta: VisitaAlerta) => {
    setRealizadaAlerta(alerta);
    setRealizadaOpen(true);
  };

  const atrasadasList = alertas.filter((a) => a.status === "atrasada");
  const hojeList = alertas.filter((a) => a.status === "hoje");
  const proximosList = alertas.filter(
    (a) => a.status === "proximos3dias" || a.status === "proximos7dias"
  );

  return (
    <>
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
                  "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold animate-pulse",
                  atrasadas > 0 ? "bg-red-500" : "bg-orange-500"
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
                        onRealize={handleRealize}
                      />
                    ))}
                  </div>
                )}

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
                        onRealize={handleRealize}
                      />
                    ))}
                  </div>
                )}

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
                        onRealize={handleRealize}
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

      <VisitaRealizadaDialog
        alerta={realizadaAlerta}
        open={realizadaOpen}
        onOpenChange={setRealizadaOpen}
      />
    </>
  );
}
