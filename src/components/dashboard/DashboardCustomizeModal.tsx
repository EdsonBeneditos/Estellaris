import { Settings, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DashboardWidgets } from "@/hooks/useDashboardPreferences";

interface DashboardCustomizeModalProps {
  widgets: DashboardWidgets;
  onUpdateWidget: (key: keyof DashboardWidgets, value: boolean) => void;
  onReset: () => void;
  activeCount: number;
}

const widgetLabels: Record<keyof DashboardWidgets, { label: string; description: string }> = {
  resumoFinanceiro: {
    label: "Resumo Financeiro",
    description: "Visão geral de entradas, saídas e saldo do mês",
  },
  proximasVisitas: {
    label: "Próximas Visitas",
    description: "Clientes com visitas agendadas para os próximos dias",
  },
  contratosVencer: {
    label: "Contratos a Vencer",
    description: "Contratos que vencem nos próximos 60 dias",
  },
  evolucaoLeads: {
    label: "Evolução de Leads",
    description: "Gráfico de captação e conversão dos últimos 6 meses",
  },
  atalhosRapidos: {
    label: "Atalhos Rápidos",
    description: "Acesso rápido às principais funcionalidades",
  },
};

export function DashboardCustomizeModal({
  widgets,
  onUpdateWidget,
  onReset,
  activeCount,
}: DashboardCustomizeModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Personalizar Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Escolha quais widgets exibir no seu Dashboard. Widgets ocultos não carregam dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(Object.keys(widgetLabels) as Array<keyof DashboardWidgets>).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="space-y-0.5">
                <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                  {widgetLabels[key].label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {widgetLabels[key].description}
                </p>
              </div>
              <Switch
                id={key}
                checked={widgets[key]}
                onCheckedChange={(checked) => onUpdateWidget(key, checked)}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {activeCount} de {Object.keys(widgets).length} widgets ativos
          </p>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
