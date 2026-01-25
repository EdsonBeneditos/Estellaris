import React, { createContext, useContext, useState, useEffect } from "react";

interface SimulatedOrg {
  id: string;
  nome: string;
}

interface SimulationContextType {
  isSimulating: boolean;
  simulatedOrg: SimulatedOrg | null;
  startSimulation: (org: SimulatedOrg) => void;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedOrg, setSimulatedOrg] = useState<SimulatedOrg | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("simulation_org");
    if (stored) {
      try {
        const org = JSON.parse(stored);
        setSimulatedOrg(org);
        setIsSimulating(true);
      } catch {
        sessionStorage.removeItem("simulation_org");
      }
    }
  }, []);

  const startSimulation = (org: SimulatedOrg) => {
    sessionStorage.setItem("simulation_org", JSON.stringify(org));
    setSimulatedOrg(org);
    setIsSimulating(true);
  };

  const stopSimulation = () => {
    sessionStorage.removeItem("simulation_org");
    setSimulatedOrg(null);
    setIsSimulating(false);
  };

  return (
    <SimulationContext.Provider
      value={{
        isSimulating,
        simulatedOrg,
        startSimulation,
        stopSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }
  return context;
}
