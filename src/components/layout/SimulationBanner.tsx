import { useSimulation } from "@/contexts/SimulationContext";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function SimulationBanner() {
  const { isSimulating, simulatedOrg, stopSimulation } = useSimulation();
  const navigate = useNavigate();

  if (!isSimulating || !simulatedOrg) return null;

  const handleExit = () => {
    stopSimulation();
    navigate("/super-admin");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
      <AlertTriangle className="h-4 w-4" />
      <span className="font-medium text-sm">
        Você está simulando o acesso da empresa{" "}
        <strong className="font-bold">{simulatedOrg.nome}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExit}
        className="ml-2 h-7 bg-amber-600 border-amber-700 text-white hover:bg-amber-700 hover:text-white"
      >
        <X className="h-3 w-3 mr-1" />
        Sair da Simulação
      </Button>
    </div>
  );
}
