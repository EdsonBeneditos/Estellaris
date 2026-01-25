import { 
  Plus, 
  Users, 
  FileText, 
  Package, 
  DollarSign, 
  UserPlus,
  BarChart3,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WidgetAtalhosRapidosProps {
  enabled: boolean;
  onNewLead?: () => void;
}

export function WidgetAtalhosRapidos({ enabled, onNewLead }: WidgetAtalhosRapidosProps) {
  const navigate = useNavigate();

  if (!enabled) return null;

  const shortcuts = [
    {
      label: "Novo Lead",
      icon: Plus,
      color: "bg-blue-600 hover:bg-blue-700",
      action: onNewLead,
    },
    {
      label: "Clientes",
      icon: Users,
      color: "bg-emerald-600 hover:bg-emerald-700",
      action: () => navigate("/clientes"),
    },
    {
      label: "Orçamentos",
      icon: FileText,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => navigate("/orcamentos"),
    },
    {
      label: "Estoque",
      icon: Package,
      color: "bg-amber-600 hover:bg-amber-700",
      action: () => navigate("/estoque"),
    },
    {
      label: "Financeiro",
      icon: DollarSign,
      color: "bg-teal-600 hover:bg-teal-700",
      action: () => navigate("/financeiro"),
    },
    {
      label: "Prospecções",
      icon: UserPlus,
      color: "bg-indigo-600 hover:bg-indigo-700",
      action: () => navigate("/futuros-leads"),
    },
    {
      label: "Relatórios",
      icon: BarChart3,
      color: "bg-rose-600 hover:bg-rose-700",
      action: () => navigate("/relatorios"),
    },
    {
      label: "Configurações",
      icon: Settings,
      color: "bg-slate-600 hover:bg-slate-700",
      action: () => navigate("/configuracoes"),
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-zinc-200">
          <Settings className="h-5 w-5 text-slate-600" />
          Atalhos Rápidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.label}
              variant="ghost"
              onClick={shortcut.action}
              className={`flex flex-col items-center justify-center h-auto py-3 px-2 gap-1 ${shortcut.color} text-white rounded-lg transition-all hover:scale-105`}
            >
              <shortcut.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">
                {shortcut.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
