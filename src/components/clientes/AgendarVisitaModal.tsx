import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useUpdateCliente } from "@/hooks/useClientes";
import { registrarAtividadeSistema } from "@/hooks/useAtividadesCliente";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FREQUENCIAS = ["Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"];

const QUICK_DAYS = [7, 14, 30, 60, 90];

interface AgendarVisitaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNome: string;
  proximaVisitaAtual: string | null;
  rotinaVisitas: boolean;
  frequenciaAtual: string | null;
}

export function AgendarVisitaModal({
  open,
  onOpenChange,
  clienteId,
  clienteNome,
  proximaVisitaAtual,
  rotinaVisitas,
  frequenciaAtual,
}: AgendarVisitaModalProps) {
  const { data: profile } = useCurrentProfile();
  const updateCliente = useUpdateCliente();
  const queryClient = useQueryClient();

  const [novaData, setNovaData] = useState<Date | undefined>(
    proximaVisitaAtual ? new Date(proximaVisitaAtual + "T00:00:00") : undefined
  );
  const [ativarRotina, setAtivarRotina] = useState(rotinaVisitas);
  const [frequencia, setFrequencia] = useState(frequenciaAtual || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!novaData) {
      toast.error("Selecione uma data para a visita");
      return;
    }
    setSaving(true);
    try {
      const dataStr = format(novaData, "yyyy-MM-dd");
      const hoje = new Date().toISOString().slice(0, 10);

      await updateCliente.mutateAsync({
        id: clienteId,
        data: {
          proxima_visita: dataStr,
          rotina_visitas: ativarRotina,
          frequencia_visita: ativarRotina && frequencia ? frequencia : null,
          // Só atualiza ultima_visita se a data agendada for hoje (visita sendo realizada agora)
          ...(dataStr === hoje ? { ultima_visita: hoje } : {}),
        },
      });

      // Registra no histórico do cliente
      if (profile?.organization_id) {
        const descricao = ativarRotina && frequencia
          ? `Visita agendada para ${format(novaData, "dd/MM/yyyy", { locale: ptBR })} (rotina ${frequencia.toLowerCase()})`
          : `Visita agendada para ${format(novaData, "dd/MM/yyyy", { locale: ptBR })}`;
        await registrarAtividadeSistema(profile.organization_id, clienteId, descricao);
      }

      queryClient.invalidateQueries({ queryKey: ["visitas-alerts"] });
      toast.success("Visita agendada com sucesso!");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao agendar visita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Agendar Visita
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">{clienteNome}</p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Atalhos rápidos */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Atalhos rápidos</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DAYS.map((d) => {
                const date = addDays(new Date(), d);
                const selected = novaData && format(novaData, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                return (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs h-7 px-2.5",
                      selected && "bg-primary text-primary-foreground border-primary"
                    )}
                    onClick={() => setNovaData(date)}
                  >
                    +{d}d
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Calendário */}
          <Calendar
            mode="single"
            selected={novaData}
            onSelect={setNovaData}
            locale={ptBR}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border p-2 w-full"
          />

          {novaData && (
            <p className="text-sm text-center font-medium text-primary flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {format(novaData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}

          {/* Rotina de visitas */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="rotina-switch" className="text-sm font-medium cursor-pointer">
                Ativar rotina de visitas
              </Label>
              <Switch
                id="rotina-switch"
                checked={ativarRotina}
                onCheckedChange={setAtivarRotina}
              />
            </div>
            {ativarRotina && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequência</Label>
                <Select value={frequencia} onValueChange={setFrequencia}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-1.5"
            onClick={handleSave}
            disabled={!novaData || saving}
          >
            <CalendarDays className="h-4 w-4" />
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
