import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VisitaAlerta {
  id: string;
  nome: string;
  proxima_visita: string;
  status: "atrasada" | "hoje" | "proximos3dias" | "proximos7dias" | "futuro";
  diasAte: number;
}

function calcularStatusVisita(dataVisita: string): { status: VisitaAlerta["status"]; diasAte: number } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const visita = new Date(dataVisita);
  visita.setHours(0, 0, 0, 0);
  
  const diffTime = visita.getTime() - hoje.getTime();
  const diasAte = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diasAte < 0) {
    return { status: "atrasada", diasAte };
  } else if (diasAte === 0) {
    return { status: "hoje", diasAte };
  } else if (diasAte <= 3) {
    return { status: "proximos3dias", diasAte };
  } else if (diasAte <= 7) {
    return { status: "proximos7dias", diasAte };
  } else {
    return { status: "futuro", diasAte };
  }
}

export function useVisitasAlerts() {
  return useQuery({
    queryKey: ["visitas-alerts"],
    queryFn: async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Buscar clientes com rotina de visitas e próxima visita definida
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, proxima_visita")
        .eq("rotina_visitas", true)
        .eq("ativo", true)
        .not("proxima_visita", "is", null)
        .order("proxima_visita", { ascending: true });

      if (error) throw error;

      const alertas: VisitaAlerta[] = (data || [])
        .map((cliente) => {
          const { status, diasAte } = calcularStatusVisita(cliente.proxima_visita!);
          return {
            id: cliente.id,
            nome: cliente.nome,
            proxima_visita: cliente.proxima_visita!,
            status,
            diasAte,
          };
        })
        .filter((alerta) => alerta.status !== "futuro" || alerta.diasAte <= 7);

      return alertas;
    },
    refetchInterval: 60000, // Refetch a cada minuto
  });
}

export function useVisitasCount() {
  const { data: alertas = [] } = useVisitasAlerts();
  
  const atrasadas = alertas.filter((a) => a.status === "atrasada").length;
  const proximos7dias = alertas.filter(
    (a) => a.status === "hoje" || a.status === "proximos3dias" || a.status === "proximos7dias"
  ).length;
  
  return {
    total: atrasadas + proximos7dias,
    atrasadas,
    proximos7dias,
  };
}

export function getVisitaBadgeConfig(dataVisita: string | null): {
  variant: "destructive" | "warning" | "secondary" | "outline";
  label: string;
  className: string;
} | null {
  if (!dataVisita) return null;
  
  const { status, diasAte } = calcularStatusVisita(dataVisita);
  
  switch (status) {
    case "atrasada":
      return {
        variant: "destructive",
        label: diasAte === -1 ? "1 dia de atraso" : `${Math.abs(diasAte)} dias de atraso`,
        className: "bg-red-500 text-white hover:bg-red-600",
      };
    case "hoje":
      return {
        variant: "warning",
        label: "Visita hoje",
        className: "bg-orange-500 text-white hover:bg-orange-600",
      };
    case "proximos3dias":
      return {
        variant: "warning",
        label: diasAte === 1 ? "Amanhã" : `Em ${diasAte} dias`,
        className: "bg-amber-500 text-white hover:bg-amber-600",
      };
    case "proximos7dias":
      return {
        variant: "secondary",
        label: `Em ${diasAte} dias`,
        className: "bg-slate-200 text-slate-700 hover:bg-slate-300",
      };
    case "futuro":
      return {
        variant: "outline",
        label: `Em ${diasAte} dias`,
        className: "bg-green-100 text-green-700 border-green-300",
      };
    default:
      return null;
  }
}
