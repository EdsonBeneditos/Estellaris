import { useState } from "react";
import { Plus, Users, CalendarClock, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/leads/StatsCard";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useLeadsStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total de Leads (Mês)"
          value={statsLoading ? "..." : stats?.totalMonth || 0}
          icon={Users}
          description="Leads captados este mês"
        />
        <StatsCard
          title="Retornos para Hoje"
          value={statsLoading ? "..." : stats?.todayReturns || 0}
          icon={CalendarClock}
          description="Leads com retorno programado"
        />
        <StatsCard
          title="Leads em Aberto"
          value={statsLoading ? "..." : stats?.openLeads || 0}
          icon={FolderOpen}
          description="Leads ativos aguardando fechamento"
        />
      </div>

      {/* Leads Table */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Últimos Leads
        </h2>
        <LeadsTable leads={leads} isLoading={leadsLoading} />
      </div>

      {/* New Lead Modal */}
      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
