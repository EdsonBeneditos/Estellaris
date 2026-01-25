import { useState, useEffect, useCallback } from "react";

export interface DashboardWidgets {
  resumoFinanceiro: boolean;
  proximasVisitas: boolean;
  contratosVencer: boolean;
  evolucaoLeads: boolean;
  atalhosRapidos: boolean;
}

const DEFAULT_WIDGETS: DashboardWidgets = {
  resumoFinanceiro: true,
  proximasVisitas: true,
  contratosVencer: true,
  evolucaoLeads: true,
  atalhosRapidos: true,
};

const STORAGE_KEY = "dashboard-widgets-preferences";

export function useDashboardPreferences() {
  const [widgets, setWidgets] = useState<DashboardWidgets>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_WIDGETS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Error loading dashboard preferences:", e);
    }
    return DEFAULT_WIDGETS;
  });

  const updateWidget = useCallback((key: keyof DashboardWidgets, value: boolean) => {
    setWidgets((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving dashboard preferences:", e);
      }
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Error resetting dashboard preferences:", e);
    }
  }, []);

  const activeWidgetCount = Object.values(widgets).filter(Boolean).length;

  return {
    widgets,
    updateWidget,
    resetToDefaults,
    activeWidgetCount,
  };
}
